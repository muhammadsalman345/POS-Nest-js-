// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { JwtStrategy } from './jwt.strategy'; // Import kiya
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // Import kiya
import { RolesGuard } from './guards/roles.guard'; // Import kiya
// import { ConfigModule, ConfigService } from '@nestjs/config'; // TODO: Agar env variables load karne hain

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({
      secret: 'YOUR_SECRET_KEY', // TODO: ENVIRONMENT VARIABLE SE LENA HAI
      signOptions: { expiresIn: '60m' },
    }),
    // ConfigModule.forRoot(), // TODO: Agar .env se load karna hai
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard, // JwtAuthGuard ko provide kiya
    RolesGuard,   // RolesGuard ko provide kiya
    // TODO: Agar ConfigService use kar rahe hain to yahan add karein
    // {
    //   provide: JwtService,
    //   useFactory: (configService: ConfigService) => {
    //     return new JwtService({
    //       secret: configService.get<string>('JWT_SECRET'),
    //       signOptions: { expiresIn: '60m' },
    //     });
    //   },
    //   inject: [ConfigService],
    // },
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, RolesGuard], // Guards ko export kiya taake doosre modules use kar saken
})
export class AuthModule {}