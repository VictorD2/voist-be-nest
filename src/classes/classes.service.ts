/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { WaveFile } from 'wavefile';
import * as path from 'path';
import * as aws from 'aws-sdk';
import * as fs from 'fs';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { PrismaService } from 'src/prisma.service';
import { GetFolderDto } from 'src/folders/dto/get-folder.dto';

const REGION = process.env.AWS_REGION;
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async create(createClassDto: CreateClassDto, userId: number) {
    const classObj = await this.prisma.class.create({
      data: {
        name: createClassDto.name,
        folderId:
          +createClassDto.folderId === 0 ? null : +createClassDto.folderId,
        userId: +userId,
      },
    });
    const result = await this.findOne(classObj.id, userId);
    return result;
  }

  async createResumen(urlPdf: string, classId: number) {
    const classe = await this.prisma.class.update({
      data: { resume: urlPdf },
      where: { id: +classId },
    });
    return classe;
  }

  async findAll(query: GetFolderDto, userId: number) {
    const { folder } = query;
    const classes = await this.prisma.class.findMany({
      where: {
        userId,
        folderId: Number(folder) === 0 ? null : Number(folder),
      },
      include: {
        contacts: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                lastname: true,
                email: true,
              },
            },
          },
        },
      },
    });
    return classes.map((item) => {
      return {
        ...item,
        folderId: item.folderId === null ? 0 : item.folderId,
        contacts: item.contacts.map((item2) => item2.user),
      };
    });
  }

  async findOne(id: number, userId: number) {
    const classFound = await this.prisma.class.findFirst({
      where: {
        id: +id,
        userId: +userId,
      },
      include: {
        contacts: {
          include: {
            user: {
              select: {
                email: true,
                lastname: true,
                name: true,
                id: true,
              },
            },
          },
        },
      },
    });
    if (!classFound) return null;
    classFound.folderId =
      classFound.folderId === null ? 0 : classFound.folderId;

    return {
      ...classFound,
      contacts: classFound.contacts.map((item) => item.user),
    };
  }

  async update(id: number, updateClassDto: UpdateClassDto, userId: number) {
    const { contacts, folderId, ...rest } = updateClassDto;
    await this.prisma.class.update({
      data: rest,
      where: { id: +id, userId: +userId },
    });

    await this.prisma.userClass.deleteMany({
      where: { classId: Number(id) },
    });

    for (let i = 0; i < contacts.length; i++) {
      const element = contacts[i];
      await this.prisma.userClass.create({
        data: { classId: Number(id), userId: element },
      });
    }

    return await this.findOne(id, userId);
  }

  async remove(id: number, userId: number) {
    await this.prisma.class.delete({
      where: { id: +id, userId: +userId },
    });
    return id;
  }

  async saveAudio(buffer: any, fileId: number) {
    const waveFile = new WaveFile(buffer);

    // @ts-ignore
    const sampleRate = waveFile.fmt.sampleRate;
    // @ts-ignore
    const chunkSize = waveFile.data.chunkSize;
    // @ts-ignore
    const bitsPerSample = waveFile.fmt.bitsPerSample;
    // @ts-ignore
    const numChannels = waveFile.fmt.numChannels;
    const durationInSeconds =
      chunkSize / (((sampleRate * bitsPerSample) / 8) * numChannels);

    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = Math.floor(durationInSeconds % 60);

    const formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const archivosDir = path.join(__dirname, '../public');
    const fileName = `${fileId}.wav`;
    const filePath = path.join(archivosDir, fileName);
    const recordfileName = `audio/${fileId}.wav`;

    const s3 = new aws.S3({
      region: REGION,
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    });

    const params = {
      Bucket: 'voist-records',
      Key: recordfileName,
      Body: buffer,
    };

    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        throw new BadRequestException(`Error al guardar el archivo WAV ${err}`);
      } else {
        s3.upload(params, async (err, data) => {
          if (err) {
            console.error('Error al subir el archivo a S3:', err);
            throw new BadRequestException('Error al guardar el archivo en S3');
          } else {
            const wavURL = data.Location;
            await this.prisma.class.update({
              data: {
                url_audio: wavURL,
              },
              where: { id: +fileId },
            });
            this.fromFile(filePath, fileId, formattedDuration, wavURL);
            // res.status(200).send('Archivo WAV guardado exitosamente');
          }
        });
      }
    });
  }

  fromFile(
    wavFilePath: string,
    idFile: number,
    durationInSeconds: string,
    wavURL: string,
  ) {
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      '40f160f190fa418d82711ac6df2ab6ec',
      'eastus',
    );
    speechConfig.speechRecognitionLanguage = 'es-ES';
    const audioConfig = sdk.AudioConfig.fromWavFileInput(
      fs.readFileSync(wavFilePath),
    );
    const speechRecognizer = new sdk.SpeechRecognizer(
      speechConfig,
      audioConfig,
    );
    speechRecognizer.recognizeOnceAsync(async (result) => {
      switch (result.reason) {
        case sdk.ResultReason.RecognizedSpeech:
          try {
            const pdfURL = await this.createAndUploadPdf(result.text, idFile);
            await this.prisma.class.update({
              data: {
                url_pdf: pdfURL.toString(),
                url_audio: wavURL.toString(),
                duration: durationInSeconds,
              },
              where: { id: +idFile },
            });
          } catch (error) {
            throw new InternalServerErrorException();
          }

          break;
        case sdk.ResultReason.NoMatch:
          console.log('NOMATCH: Speech could not be recognized.');
          throw new BadRequestException(
            'NOMATCH: Speech could not be recognized.',
          );
          break;
        case sdk.ResultReason.Canceled:
          const cancellation = sdk.CancellationDetails.fromResult(result);
          if (cancellation.reason == sdk.CancellationReason.Error) {
            throw new BadRequestException(
              `CANCELED: ErrorCode=${cancellation.ErrorCode} CANCELED: ErrorDetails=${cancellation.errorDetails}`,
            );
          }
          throw new BadRequestException(
            `CANCELED: Reason=${cancellation.reason}`,
          );
          break;
      }
      speechRecognizer.close();
    });
  }

  async createAndUploadPdf(content: string, id: number) {
    const pageWidth = 595;
    const pageHeight = 842;
    const lineHeight = 20;

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const margin = 50;
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const words = content.split(' ');
    let line = '';

    for (const word of words) {
      try {
        const currentLine = line + (line ? ' ' : '') + word;
        const textSize = font.widthOfTextAtSize(currentLine, 12);
        if (textSize > pageWidth - 2 * margin) {
          currentPage.drawText(line, {
            x: margin,
            y,
            size: 12,
            color: rgb(0, 0, 0),
          });
          y -= lineHeight;

          if (y - lineHeight < margin) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }

          line = word;
        } else {
          line = currentLine;
        }
      } catch (error) {}
    }
    if (line) {
      currentPage.drawText(line, {
        x: margin,
        y,
        size: 12,
        color: rgb(0, 0, 0),
      });
    }

    const fileName = `transcripts/${id}.pdf`;

    const pdfBytes = await pdfDoc.save();

    const s3 = new aws.S3({
      region: REGION,
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    });

    const params = {
      Bucket: 'voist-records',
      Key: fileName,
      Body: pdfBytes,
      ContentType: 'application/pdf',
    };

    try {
      const result = await s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      console.error('Error al subir el PDF a S3:', error);
    }
  }

  async createAndUploadPdfResumen(content: string, id: number) {
    const pageWidth = 595;
    const pageHeight = 842;
    const lineHeight = 20;

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const margin = 50;
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const words = content.split(' ');
    let line = '';

    for (const word of words) {
      try {
        const currentLine = line + (line ? ' ' : '') + word;
        const textSize = font.widthOfTextAtSize(currentLine, 12);
        if (textSize > pageWidth - 2 * margin) {
          currentPage.drawText(line, {
            x: margin,
            y,
            size: 12,
            color: rgb(0, 0, 0),
          });
          y -= lineHeight;

          if (y - lineHeight < margin) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }

          line = word;
        } else {
          line = currentLine;
        }
      } catch (error) {}
    }
    if (line) {
      currentPage.drawText(line, {
        x: margin,
        y,
        size: 12,
        color: rgb(0, 0, 0),
      });
    }

    const fileName = `resumen/${id}.pdf`;

    const pdfBytes = await pdfDoc.save();

    const s3 = new aws.S3({
      region: REGION,
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    });

    const params = {
      Bucket: 'voist-records',
      Key: fileName,
      Body: pdfBytes,
      ContentType: 'application/pdf',
    };

    try {
      const result = await s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      console.error('Error al subir el PDF a S3:', error);
    }
  }
}
