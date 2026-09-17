from pathlib import Path
from html import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Preformatted, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
pdfmetrics.registerFont(TTFont('ReportSans', str(ROOT / 'docs/fonts/DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('ReportSans-Bold', str(ROOT / 'docs/fonts/DejaVuSans-Bold.ttf')))
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyID', fontName='ReportSans', fontSize=9.6, leading=14.2, spaceAfter=9, textColor=HexColor('#263445')))
styles.add(ParagraphStyle(name='BulletID', parent=styles['BodyID'], leftIndent=12, firstLineIndent=-8, spaceAfter=5))
for heading in ['Heading1', 'Heading2', 'Heading3']:
    styles[heading].fontName = 'ReportSans-Bold'
styles['Heading1'].textColor = HexColor('#113858')
styles['Heading1'].fontSize = 20
styles['Heading1'].leading = 26
styles['Heading1'].spaceAfter = 18
styles['Heading2'].textColor = HexColor('#137e87')
styles['Heading2'].fontSize = 13
styles['Heading2'].leading = 18
styles['Heading2'].spaceBefore = 10
styles['Heading2'].spaceAfter = 9
styles['Heading3'].fontSize = 11
styles['Heading3'].leading = 16
styles['Code'].fontSize = 9
styles['Code'].leading = 13

story, para, code = [], [], None
def flush():
    if para:
        story.append(Paragraph(escape(' '.join(para)), styles['BodyID']))
        para.clear()

for line in (ROOT / 'docs/Laporan.md').read_text(encoding='utf-8').splitlines():
    if line.startswith('```'):
        flush()
        if code is None:
            code = []
        else:
            story.extend([Preformatted('\n'.join(code), styles['Code']), Spacer(1, 12)])
            code = None
        continue
    if code is not None:
        code.append(line)
    elif line == '\\page':
        flush(); story.append(PageBreak())
    elif not line.strip():
        flush()
    elif line.startswith('#'):
        flush()
        level = len(line) - len(line.lstrip('#'))
        story.append(Paragraph(escape(line[level:].strip()), styles[f'Heading{min(level, 3)}']))
    elif line.startswith('- '):
        flush(); story.append(Paragraph('- ' + escape(line[2:]), styles['BulletID']))
    else:
        para.append(line)
flush()

captions = [
    ('01-tanpa-token.png', 'Gambar 1. Penolakan akses tanpa token JWT.'),
    ('02-token-invalid.png', 'Gambar 2. Penolakan token JWT tidak valid.'),
    ('03-password-salah.png', 'Gambar 3. Penolakan login dengan kata sandi salah.'),
    ('04-login-berhasil.png', 'Gambar 4. Login berhasil dan penerbitan JWT.'),
    ('05-token-valid.png', 'Gambar 5. Akses valid dan payload AES-256-GCM.')
]
for filename, caption in captions:
    path = ROOT / 'docs/screenshots' / filename
    if path.is_file():
        width, height = ImageReader(str(path)).getSize()
        scale = min(480 / width, 570 / height)
        story.extend([PageBreak(), Paragraph('Lampiran Bukti Postman', styles['Heading1']),
                      Image(str(path), width=width*scale, height=height*scale), Spacer(1, 12),
                      Paragraph(caption, styles['BodyID'])])

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(HexColor('#d8e2eb'))
    canvas.line(48, 42, A4[0]-48, 42)
    canvas.setFont('ReportSans', 8)
    canvas.setFillColor(HexColor('#60758b'))
    canvas.drawString(48, 29, 'SISTEM TERDISTRIBUSI | TUGAS 2')
    canvas.drawRightString(A4[0]-48, 29, str(doc.page))
    canvas.restoreState()

output = ROOT / 'docs/Laporan_Tugas2.pdf'
SimpleDocTemplate(str(output), pagesize=A4, rightMargin=48, leftMargin=48, topMargin=45,
                  bottomMargin=58, title='Laporan Tugas 2 - Keamanan Backend', author='').build(story, onFirstPage=footer, onLaterPages=footer)
print(output)
