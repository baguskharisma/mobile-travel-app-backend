import PDFDocument from 'pdfkit';
import { TravelDocument, Schedule, Route, Vehicle, Admin } from '@prisma/client';

interface TravelDocumentWithRelations extends TravelDocument {
  schedule: Schedule & {
    route: Route;
    vehicle: Vehicle;
  };
  vehicle: Vehicle;
  admin: Partial<Admin>;
}

export class TravelDocumentPdfGenerator {
  /**
   * Generate PDF for travel document
   */
  static async generatePdf(document: TravelDocumentWithRelations): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('SURAT JALAN', { align: 'center' })
          .moveDown(0.5);

        doc
          .fontSize(12)
          .font('Helvetica')
          .text('Travel Document', { align: 'center' })
          .moveDown(2);

        // Document Information
        doc.fontSize(10).font('Helvetica-Bold').text('INFORMASI DOKUMEN');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        doc.font('Helvetica');
        this.addRow(doc, 'Nomor Dokumen:', document.documentNumber);
        this.addRow(
          doc,
          'Tanggal Terbit:',
          document.issuedAt
            ? this.formatDate(document.issuedAt)
            : 'Belum Diterbitkan',
        );
        this.addRow(doc, 'Status:', this.translateStatus(document.status));
        doc.moveDown();

        // Route Information
        doc.fontSize(10).font('Helvetica-Bold').text('INFORMASI RUTE');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        doc.font('Helvetica');
        this.addRow(doc, 'Kode Rute:', document.schedule.route.routeCode);
        this.addRow(doc, 'Asal:', document.schedule.route.origin);
        this.addRow(doc, 'Tujuan:', document.schedule.route.destination);
        this.addRow(
          doc,
          'Tanggal Keberangkatan:',
          this.formatDate(document.departureDate),
        );
        this.addRow(
          doc,
          'Jam Keberangkatan:',
          this.formatTime(document.schedule.departureTime),
        );
        doc.moveDown();

        // Vehicle Information
        doc.fontSize(10).font('Helvetica-Bold').text('INFORMASI KENDARAAN');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        doc.font('Helvetica');
        this.addRow(doc, 'Nomor Kendaraan:', document.vehicle.vehicleNumber);
        this.addRow(doc, 'Tipe:', document.vehicle.type);
        if (document.vehicle.brand) {
          this.addRow(doc, 'Merek:', document.vehicle.brand);
        }
        if (document.vehicle.model) {
          this.addRow(doc, 'Model:', document.vehicle.model);
        }
        this.addRow(doc, 'Kapasitas:', `${document.vehicle.capacity} penumpang`);
        doc.moveDown();

        // Driver Information
        doc.fontSize(10).font('Helvetica-Bold').text('INFORMASI PENGEMUDI');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        doc.font('Helvetica');
        this.addRow(doc, 'Nama:', document.driverName);
        this.addRow(doc, 'Telepon:', document.driverPhone);
        doc.moveDown();

        // Passenger Information
        doc.fontSize(10).font('Helvetica-Bold').text('INFORMASI PENUMPANG');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        doc.font('Helvetica');
        this.addRow(doc, 'Jumlah Penumpang:', document.totalPassengers.toString());
        doc.moveDown();

        // Notes
        if (document.notes) {
          doc.fontSize(10).font('Helvetica-Bold').text('CATATAN');
          doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
          doc.moveDown(0.5);
          doc.font('Helvetica').text(document.notes);
          doc.moveDown();
        }

        // Issued by
        doc.moveDown(2);
        doc.fontSize(10).font('Helvetica');
        this.addRow(doc, 'Diterbitkan oleh:', document.admin.name || 'N/A');
        this.addRow(
          doc,
          'Tanggal cetak:',
          this.formatDate(new Date()),
        );

        // Footer
        doc.moveDown(3);
        doc
          .fontSize(8)
          .font('Helvetica-Oblique')
          .text(
            'Dokumen ini dibuat secara elektronik dan sah tanpa tanda tangan',
            { align: 'center' },
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static addRow(doc: typeof PDFDocument, label: string, value: string) {
    const y = doc.y;
    doc.text(label, 50, y, { width: 150 });
    doc.text(value, 220, y);
    doc.moveDown(0.5);
  }

  private static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  }

  private static formatTime(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }).format(new Date(date));
  }

  private static translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      DRAFT: 'Draft',
      ISSUED: 'Diterbitkan',
      CANCELLED: 'Dibatalkan',
    };
    return statusMap[status] || status;
  }
}
