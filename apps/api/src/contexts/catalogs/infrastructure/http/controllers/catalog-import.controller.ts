import {
  ArgumentsHost,
  BadRequestException,
  Body,
  Catch,
  Controller,
  ExceptionFilter,
  Headers,
  HttpCode,
  HttpStatus,
  PayloadTooLargeException,
  Post,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CatalogImportCommitResult,
  CatalogImportInspectResult,
  CatalogImportPreviewResult,
} from '@lt-offers/domain';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validate } from 'class-validator';
import { CatalogImportUseCases, ImportFile } from '../../../application';
import { handleCatalogDomainError, resolveAuthor } from '../controller-shared';
import {
  CatalogImportCommitDto,
  CatalogImportPreviewOptionsDto,
} from '../dto/catalog-import.dto';

/** Limite de upload (design D2): o template legado tem ~30 MB. */
export const MAX_IMPORT_FILE_BYTES = 40 * 1024 * 1024;

export const FILE_TOO_LARGE_MESSAGE =
  'O arquivo excede o limite de 40 MB para importação';

const OPTIONS_MESSAGE =
  'Envie as opções da prévia (catálogo, aba, cabeçalho, mapeamento e vigência) em JSON no campo "options"';

const UPLOAD = FileInterceptor('file', {
  limits: { fileSize: MAX_IMPORT_FILE_BYTES, files: 1 },
});

interface UploadedSpreadsheet {
  originalname?: string;
  buffer: Buffer;
}

interface JsonResponse {
  status(code: number): { json(body: unknown): void };
}

const UPLOAD_FIELD_MESSAGE =
  'Envie uma única planilha no campo "file" e as opções no campo "options"';

// Mensagens do multer (em inglês) para campos fora do contrato do upload
const MULTER_MESSAGES: Record<string, string> = {
  'Unexpected field': UPLOAD_FIELD_MESSAGE,
  'Too many files': UPLOAD_FIELD_MESSAGE,
  'Too many fields': UPLOAD_FIELD_MESSAGE,
  'Too many parts': UPLOAD_FIELD_MESSAGE,
  'Field name too long': UPLOAD_FIELD_MESSAGE,
  'Field value too long':
    'As opções da prévia excedem o tamanho permitido para o campo "options"',
};

/**
 * O multer responde em inglês ("File too large", "Unexpected field"); aqui as
 * respostas do upload viram pt-BR (RNF-14). Demais 400 passam intactos.
 */
@Catch(PayloadTooLargeException, BadRequestException)
export class ImportUploadExceptionFilter implements ExceptionFilter {
  catch(
    error: PayloadTooLargeException | BadRequestException,
    host: ArgumentsHost,
  ): void {
    const response = host.switchToHttp().getResponse<JsonResponse>();
    const status = error.getStatus();
    if (error instanceof PayloadTooLargeException) {
      response.status(status).json({
        statusCode: status,
        message: FILE_TOO_LARGE_MESSAGE,
        error: 'Payload Too Large',
      });
      return;
    }
    const translated = MULTER_MESSAGES[error.message];
    response
      .status(status)
      .json(
        translated
          ? { statusCode: status, message: translated, error: 'Bad Request' }
          : error.getResponse(),
      );
  }
}

function toImportFile(file?: UploadedSpreadsheet): ImportFile | null {
  return file?.buffer
    ? { buffer: file.buffer, fileName: file.originalname ?? '' }
    : null;
}

function messagesOf(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
}

/**
 * Importação Analítica dos catálogos planos (spec catalogos/importacao-analitica):
 * inspect (abas + primeiras linhas) → preview (classificação linha a linha)
 * → commit (grava só os itens novos). O arquivo vive só na requisição (D2).
 */
@Controller('catalogs/import')
@UseFilters(ImportUploadExceptionFilter)
export class CatalogImportController {
  constructor(private readonly useCases: CatalogImportUseCases) {}

  @Post('inspect')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(UPLOAD)
  inspect(
    @UploadedFile() file?: UploadedSpreadsheet,
  ): CatalogImportInspectResult {
    try {
      return this.useCases.inspect(toImportFile(file));
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(UPLOAD)
  async preview(
    @UploadedFile() file?: UploadedSpreadsheet,
    @Body('options') options?: string,
  ): Promise<CatalogImportPreviewResult> {
    const request = await this.parseOptions(options);
    try {
      return await this.useCases.preview(toImportFile(file), request);
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Post('commit')
  @HttpCode(HttpStatus.OK)
  async commit(
    @Body() dto: CatalogImportCommitDto,
    @Headers('x-user') user?: string,
  ): Promise<CatalogImportCommitResult> {
    try {
      return await this.useCases.commit(dto, resolveAuthor(user));
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  // Campos multipart chegam como texto: as opções vêm num JSON validado aqui
  // com o mesmo rigor do ValidationPipe
  private async parseOptions(
    options?: string,
  ): Promise<CatalogImportPreviewOptionsDto> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(options ?? '');
    } catch {
      parsed = null;
    }
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new BadRequestException(OPTIONS_MESSAGE);
    }
    const dto = plainToInstance(CatalogImportPreviewOptionsDto, parsed);
    const errors = messagesOf(await validate(dto));
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
    return dto;
  }
}
