import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import type { CaseData } from "./case.js";

export async function renderCaseAsDocx(data: CaseData): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({ text: `${data.personName} — ${data.ladderName}`, heading: HeadingLevel.HEADING_1 })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Cycle: ${data.cycleName} (${data.cycleStart} to ${data.cycleEnd})`, italics: true })],
    })
  );

  for (const section of data.sections) {
    children.push(
      new Paragraph({
        text: `${section.tagName} (${section.notes.length} note${section.notes.length === 1 ? "" : "s"})`,
        heading: HeadingLevel.HEADING_2,
      })
    );

    if (section.notes.length === 0) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: "⚠ No evidence logged this cycle.", italics: true })] })
      );
    } else {
      for (const note of section.notes) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: `${note.date} — `, bold: true }),
              new TextRun({ text: note.body }),
            ],
          })
        );
      }
    }
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated from ${data.totalNotes} note${data.totalNotes === 1 ? "" : "s"} logged ${data.cycleStart} to ${data.cycleEnd}.`,
          italics: true,
          size: 18,
        }),
      ],
    })
  );

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
