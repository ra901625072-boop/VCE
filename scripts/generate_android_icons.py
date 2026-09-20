"""Generate Android mipmap launcher icons for all screen densities from vce-icon-256.png"""
from pathlib import Path
from PIL import Image, ImageDraw

def generate_icons():
    src_path = Path("frontend/assets/vce-icon-256.png")
    if not src_path.exists():
        print(f"Error: {src_path} not found")
        return

    src_img = Image.open(src_path).convert("RGBA")
    
    # Target densities and dimensions
    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192
    }
    
    res_dir = Path("android/app/src/main/res")
    
    for folder, size in densities.items():
        out_folder = res_dir / folder
        out_folder.mkdir(parents=True, exist_ok=True)
        
        # 1. Standard Square Launcher Icon (with dark carbon background & rounded corners)
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(canvas)
        
        # Rounded rectangle background
        radius = int(size * 0.22)
        draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=radius, fill=(24, 24, 27, 255), outline=(39, 39, 42, 255), width=max(1, int(size * 0.02)))
        
        # Place emblem centered inside (padding ~15%)
        pad = int(size * 0.12)
        emblem_size = size - (pad * 2)
        resized_emblem = src_img.resize((emblem_size, emblem_size), Image.Resampling.LANCZOS)
        canvas.paste(resized_emblem, (pad, pad), resized_emblem)
        
        canvas.save(out_folder / "ic_launcher.png", "PNG")
        
        # 2. Round Launcher Icon (circle mask)
        round_canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        round_draw = ImageDraw.Draw(round_canvas)
        round_draw.ellipse([(0, 0), (size - 1, size - 1)], fill=(24, 24, 27, 255), outline=(194, 65, 12, 255), width=max(1, int(size * 0.025)))
        
        round_pad = int(size * 0.15)
        round_emblem_size = size - (round_pad * 2)
        round_resized = src_img.resize((round_emblem_size, round_emblem_size), Image.Resampling.LANCZOS)
        round_canvas.paste(round_resized, (round_pad, round_pad), round_resized)
        
        round_canvas.save(out_folder / "ic_launcher_round.png", "PNG")
        print(f"Generated {folder}: {size}x{size}")

    # Generate adaptive icon foreground (432x432 for xxxhdpi adaptive)
    fg_size = 432
    fg_canvas = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
    emblem_fg_size = int(fg_size * 0.65)
    fg_pad = (fg_size - emblem_fg_size) // 2
    fg_resized = src_img.resize((emblem_fg_size, emblem_fg_size), Image.Resampling.LANCZOS)
    fg_canvas.paste(fg_resized, (fg_pad, fg_pad), fg_resized)
    
    drawable_dir = res_dir / "drawable"
    drawable_dir.mkdir(exist_ok=True)
    fg_canvas.save(drawable_dir / "vce_launcher_foreground.png", "PNG")
    print("Generated adaptive foreground asset.")

if __name__ == "__main__":
    generate_icons()
