import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { HashingService } from '../../../common/security/hashing.service';
import { sha256Hex } from '../../../common/security/token.util';
import { UsersService } from '../../users/services/users.service';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import type { AuthTokens, JwtPayload } from '../types/jwt-payload';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmailWithSecret(dto.email);
    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await this.hashingService.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const tokenHash = sha256Hex(dto.refreshToken);

    const stored = await this.refreshTokenRepository.findValid(payload.sub, tokenHash);
    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotation: the presented token is single-use.
    await this.refreshTokenRepository.revokeById(stored.id);

    const user = await this.usersService.findEntityById(payload.sub);
    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.buildAuthResponse(user);
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokenRepository.revokeAllForUser(userId);
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async buildAuthResponse(user: User): Promise<AuthResponseDto> {
    const tokens = await this.issueTokens(user);
    return { ...tokens, user: UserResponseDto.fromEntity(user) };
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('jwt.secret'),
        expiresIn: this.configService.getOrThrow<string>(
          'jwt.expiresIn',
        ) as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: this.configService.getOrThrow<string>(
          'jwt.refreshExpiresIn',
        ) as JwtSignOptions['expiresIn'],
      }),
    ]);

    const decoded = this.jwtService.decode(refreshToken) as { exp?: number } | null;
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + SEVEN_DAYS_MS);

    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: sha256Hex(refreshToken),
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
}
