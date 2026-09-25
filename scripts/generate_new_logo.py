"""
Generate All Project Logo & Icon Assets from the Chosen Concept Image
Input: User concept logo circled in blue (media_1790345592971.png)
Outputs:
  - frontend/assets/vce-logo.svg (Razor-sharp vector SVG, theme-adaptive)
  - frontend/assets/vce-logo-black.svg (Monochrome dark vector for documents & print)
  - frontend/assets/vce-logo.png (High-res transparent PNG)
  - frontend/assets/vce-icon-256.png (256x256 RGBA app icon)
  - frontend/assets/favicon.png (32x32 crisp favicon badge)
"""

import sys
from pathlib import Path
import xml.etree.ElementTree as ET
import cv2
import numpy as np
from PIL import Image, ImageDraw

def generate_all_assets():
    project_root = Path(__file__).resolve().parent.parent
    src_path = Path(r"C:\Users\ASUS\.gemini\antigravity\brain\3ef4f422-630a-4f48-98f0-59c169b048c5\.user_uploaded\media_1790345592971.png")
    
    if not src_path.exists():
        print(f"Error: Source image not found at {src_path}")
        return False

    print(f"Loading source image from {src_path}...")
    src_bgr = cv2.imread(str(src_path), cv2.IMREAD_UNCHANGED)
    
    # Crop the black strip on the right (x >= 324)
    clean_bgr = src_bgr[:, :324, :3]
    h, w, _ = clean_bgr.shape
    print(f"Cleaned source dimensions: {w}x{h}")
    
    # -------------------------------------------------------------
    # 1. Sub-pixel 8x Supersampling & Contour Tracing for SVG Vector
    # -------------------------------------------------------------
    scale = 8
    gray = cv2.cvtColor(clean_bgr, cv2.COLOR_BGR2GRAY)
    up = cv2.resize(gray, (w * scale, h * scale), interpolation=cv2.INTER_CUBIC)
    blurred = cv2.GaussianBlur(up, (9, 9), 1.5)
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_TC89_KCOS)
    min_area = 500 * (scale / 4) ** 2
    contours = [c for c in contours if cv2.contourArea(c) > min_area]
    contours = sorted(contours, key=lambda c: cv2.boundingRect(c)[0])
    
    print(f"Extracted {len(contours)} core contours for VCE emblem.")
    
    all_pts = np.vstack([c[:, 0, :] for c in contours]).astype(np.float32) / scale
    min_x, min_y = all_pts.min(axis=0)
    max_x, max_y = all_pts.max(axis=0)
    glyph_w = max_x - min_x
    glyph_h = max_y - min_y
    print(f"Glyph bounds: width={glyph_w:.2f}, height={glyph_h:.2f} (aspect ratio: {glyph_w/glyph_h:.3f})")
    
    # Target SVG ViewBox: 280 x 120
    vb_w, vb_h = 280.0, 120.0
    pad_x = (vb_w - glyph_w) / 2.0 - min_x
    pad_y = (vb_h - glyph_h) / 2.0 - min_y
    
    id_labels = ["v-upper-c", "lower-c", "e-wings-top-mid", "e-wing-bot"]
    path_data_list = []
    
    for idx, c in enumerate(contours):
        approx = cv2.approxPolyDP(c, 0.20 * scale, True)
        pts = approx[:, 0, :].astype(np.float32) / scale
        pts[:, 0] += pad_x
        pts[:, 1] += pad_y
        d = f"M{pts[0][0]:.2f},{pts[0][1]:.2f}" + "".join([f" L{p[0]:.2f},{p[1]:.2f}" for p in pts[1:]]) + " Z"
        label = id_labels[idx] if idx < len(id_labels) else f"part-{idx}"
        path_data_list.append((label, d))
    
    # Assemble master theme-aware vce-logo.svg
    svg_lines = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 120" width="100%" height="100%">',
        '  <!-- VCE Gujarat Official Monogram Emblem (New Fluid Identity) -->',
        '  <defs>',
        '    <filter id="vceDropGlow" x="-20%" y="-20%" width="140%" height="140%">',
        '      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />',
        '      <feFlood flood-color="#EA580C" flood-opacity="0.4" result="glowColor" />',
        '      <feComposite in="glowColor" in2="blur" operator="in" result="glow" />',
        '      <feMerge>',
        '        <feMergeNode in="glow" />',
        '        <feMergeNode in="SourceGraphic" />',
        '      </feMerge>',
        '    </filter>',
        '  </defs>',
        '  <style>',
        '    .vce-glyph {',
        '      fill: #F4F4F5;',
        '      transition: fill 0.2s ease;',
        '    }',
        '    @media (prefers-color-scheme: light) {',
        '      .vce-glyph {',
        '        fill: #18181B;',
        '      }',
        '    }',
        '    @media print {',
        '      .vce-glyph {',
        '        fill: #000000 !important;',
        '      }',
        '    }',
        '  </style>',
        '  <g id="vce-logo-group" class="vce-glyph" filter="url(#vceDropGlow)">'
    ]
    for label, d in path_data_list:
        svg_lines.append(f'    <path id="vce-{label}" d="{d}" />')
    svg_lines.append('  </g>')
    svg_lines.append('</svg>\n')
    
    svg_path = project_root / "frontend" / "assets" / "vce-logo.svg"
    svg_content = "\n".join(svg_lines)
    ET.fromstring(svg_content)  # Validate XML
    svg_path.write_text(svg_content, encoding="utf-8")
    print(f"Generated and validated {svg_path}")
    
    # -------------------------------------------------------------
    # 2. Generate Monochrome Dark Vector (for print & documents)
    # -------------------------------------------------------------
    svg_black_lines = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 120" width="100%" height="100%">',
        '  <!-- VCE Gujarat Official Monogram Emblem (Monochrome Ink) -->',
        '  <g id="vce-logo-group-black" fill="#18181B">'
    ]
    for label, d in path_data_list:
        svg_black_lines.append(f'    <path id="vce-black-{label}" d="{d}" />')
    svg_black_lines.append('  </g>')
    svg_black_lines.append('</svg>\n')
    
    svg_black_path = project_root / "frontend" / "assets" / "vce-logo-black.svg"
    svg_black_content = "\n".join(svg_black_lines)
    ET.fromstring(svg_black_content)
    svg_black_path.write_text(svg_black_content, encoding="utf-8")
    print(f"Generated and validated {svg_black_path}")

    # -------------------------------------------------------------
    # 3. High-Resolution Transparent Raster (1024 width)
    # -------------------------------------------------------------
    target_render_w = 1024
    target_render_h = int(target_render_w * (glyph_h / glyph_w))
    
    # Render antialiased mask
    render_scale = 16
    up_render = cv2.resize(gray, (w * render_scale, h * render_scale), interpolation=cv2.INTER_CUBIC)
    blurred_render = cv2.GaussianBlur(up_render, (17, 17), 3.0)
    _, thresh_render = cv2.threshold(blurred_render, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    contours_render, _ = cv2.findContours(thresh_render, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_TC89_KCOS)
    contours_render = [c for c in contours_render if cv2.contourArea(c) > 500 * (render_scale / 4) ** 2]
    
    mask_canvas = np.zeros_like(thresh_render)
    for c in contours_render:
        approx = cv2.approxPolyDP(c, 0.20 * render_scale, True)
        cv2.drawContours(mask_canvas, [approx], -1, 255, thickness=-1)
        
    ys, xs = np.where(mask_canvas > 10)
    crop_canvas = mask_canvas[ys.min():ys.max()+1, xs.min():xs.max()+1]
    
    # Resize to high-resolution master mask
    master_mask = cv2.resize(crop_canvas, (target_render_w, target_render_h), interpolation=cv2.INTER_AREA)
    
    # High-Res Transparent PNG (White for dark themes)
    logo_png = np.zeros((target_render_h, target_render_w, 4), dtype=np.uint8)
    logo_png[:, :, 0] = 244  # R
    logo_png[:, :, 1] = 244  # G
    logo_png[:, :, 2] = 245  # B
    logo_png[:, :, 3] = master_mask
    logo_png_path = project_root / "frontend" / "assets" / "vce-logo.png"
    Image.fromarray(logo_png).save(logo_png_path, "PNG")
    print(f"Generated {logo_png_path} ({target_render_w}x{target_render_h})")

    # High-Res Dark Ink PNG (for documents/light themes)
    logo_dark_png = np.zeros((target_render_h, target_render_w, 4), dtype=np.uint8)
    logo_dark_png[:, :, 0] = 24   # R
    logo_dark_png[:, :, 1] = 24   # G
    logo_dark_png[:, :, 2] = 27   # B
    logo_dark_png[:, :, 3] = master_mask
    logo_dark_png_path = project_root / "frontend" / "assets" / "vce-logo-dark.png"
    Image.fromarray(logo_dark_png).save(logo_dark_png_path, "PNG")
    print(f"Generated {logo_dark_png_path} ({target_render_w}x{target_render_h})")

    # -------------------------------------------------------------
    # 4. Generate vce-icon-256.png (App Icon & Launcher Source)
    # -------------------------------------------------------------
    icon_size = 256
    icon_canvas = Image.new("RGBA", (icon_size, icon_size), (0, 0, 0, 0))
    emblem_w = 232
    emblem_h = int(emblem_w * (target_render_h / target_render_w))
    
    white_emblem_pil = Image.fromarray(logo_png)
    resized_emblem = white_emblem_pil.resize((emblem_w, emblem_h), Image.Resampling.LANCZOS)
    
    paste_x = (icon_size - emblem_w) // 2
    paste_y = (icon_size - emblem_h) // 2
    icon_canvas.paste(resized_emblem, (paste_x, paste_y), resized_emblem)
    
    icon_256_path = project_root / "frontend" / "assets" / "vce-icon-256.png"
    icon_canvas.save(icon_256_path, "PNG")
    print(f"Generated {icon_256_path} (256x256)")

    # -------------------------------------------------------------
    # 5. Generate favicon.png (32x32 crisp badge)
    # -------------------------------------------------------------
    fav_size = 32
    fav_canvas = Image.new("RGBA", (fav_size, fav_size), (0, 0, 0, 0))
    fav_draw = ImageDraw.Draw(fav_canvas)
    
    # Rounded dark carbon badge with terracotta border
    fav_draw.rounded_rectangle(
        [(0, 0), (fav_size - 1, fav_size - 1)],
        radius=7,
        fill=(24, 24, 27, 255),
        outline=(194, 65, 12, 255),
        width=1
    )
    
    fav_emblem_w = 26
    fav_emblem_h = int(fav_emblem_w * (target_render_h / target_render_w))
    fav_resized = white_emblem_pil.resize((fav_emblem_w, fav_emblem_h), Image.Resampling.LANCZOS)
    
    fav_paste_x = (fav_size - fav_emblem_w) // 2
    fav_paste_y = (fav_size - fav_emblem_h) // 2
    fav_canvas.paste(fav_resized, (fav_paste_x, fav_paste_y), fav_resized)
    
    fav_path = project_root / "frontend" / "assets" / "favicon.png"
    fav_canvas.save(fav_path, "PNG")
    print(f"Generated {fav_path} (32x32)")
    
    return True

if __name__ == "__main__":
    success = generate_all_assets()
    sys.exit(0 if success else 1)
