from pathlib import Path

pages_dir = Path('frontend/pages')
for f in pages_dir.glob('*.html'):
    content = f.read_text(encoding='utf-8')
    if '/assets/favicon.png' not in content:
        idx = content.find('</title>')
        if idx != -1:
            end_idx = idx + len('</title>')
            favicon_tag = (
                '\n  <link rel="icon" type="image/png" href="/assets/favicon.png" />'
                '\n  <link rel="apple-touch-icon" href="/assets/vce-icon-256.png" />'
            )
            new_content = content[:end_idx] + favicon_tag + content[end_idx:]
            f.write_text(new_content, encoding='utf-8')
            print(f'Added favicon to: {f.name}')

print('All pages updated with VCE favicon.')
