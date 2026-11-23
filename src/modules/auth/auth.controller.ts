import {
   Controller,
   Post,
   HttpCode,
   UseGuards,
   Body,
   Param,
   Patch,
} from '@nestjs/common';
import { AuthUser } from './decorator/auth-user.decorator';
import { UserDto } from 'src/modules/user/dto/user.dto';
import { LocalAuthGuard } from './guards/local-auth-guard';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
   ApiOperation,
   ApiResponse,
   ApiParam,
   ApiProperty,
} from '@nestjs/swagger';
import { AuthEmailDto } from './dto/auth-email.dto';
import { AuthUpdatePasswordDto } from './dto/auth-update-password.dto';
import { Throttle, minutes } from '@nestjs/throttler';
import { GoogleLoginDto } from './dto/google-login.dto';

@Controller('auth')
export class AuthController {
   constructor(private authService: AuthService) {}

   @ApiOperation({ summary: 'Login' })
   @Throttle({ default: { limit: 5, ttl: minutes(1) } })
   @UseGuards(LocalAuthGuard)
   @Post('login')
   @HttpCode(200)
   signIn(@AuthUser() user: UserDto) {
      return this.authService.signIn(user);
   }

   @Post('refresh')
   @ApiOperation({ summary: 'Obter novo token de acesso' })
   async refresh(@Body() dto: RefreshTokenDto) {
      return this.authService.refresh(dto.refreshToken);
   }

   @Throttle({ default: { limit: 10, ttl: minutes(1) } })
   @Post('forgot-password')
   @HttpCode(200)
   @ApiOperation({
      description:
         'Gerar token de redefinição de senha e enviar e-mail para o usuário.',
   })
   @ApiResponse({
      status: 200,
      description:
         'O sucesso é retornado mesmo que o e-mail não exista por motivos de segurança.',
   })
   async forgotPassword(@Body() authEmailDto: AuthEmailDto): Promise<void> {
      return this.authService.forgotPassword(authEmailDto.email);
   }

   @Patch(':resetToken/reset-password')
   @ApiOperation({
      description:
         'Se o resetToken existir e ainda for válido, atualizar a senha.',
      operationId: 'auth_resetUpdatePassword',
   })
   @ApiParam({
      name: 'resetToken',
      description: 'The reset token',
      schema: { type: 'string', format: 'uuid' },
   })
   @ApiResponse({
      status: 200,
      description: 'Senha alterada com sucesso.',
   })
   @ApiResponse({ status: 400, description: 'Requisição inválida.' })
   @ApiResponse({
      status: 404,
      description: 'Token não existe ou expirou.',
   })
   @ApiOperation({
      description: 'Token de redefinição de senha',
   })
   @Throttle({ default: { limit: 5, ttl: minutes(1) } })
   @HttpCode(200)
   async resetPassword(
      @Param('resetToken') resetToken: string,
      @Body() authUpdatePasswordDto: AuthUpdatePasswordDto,
   ) {
      return this.authService.updatePassword(resetToken, authUpdatePasswordDto);
   }

   @ApiOperation({ summary: 'Logar com Google' })
   @Throttle({ default: { limit: 10, ttl: minutes(1) } })
   @HttpCode(200)
   @Post('google')
   google(@Body() dto: GoogleLoginDto) {
      return this.authService.loginWithGoogle(dto.credential);
   }
}
