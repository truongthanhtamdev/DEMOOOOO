"""Tạo bản website (thư mục nhiem-vu/ ở gốc repo) từ dau-truong-nhiem-vu/index.html.
Chạy: python3 dau-truong-nhiem-vu/build.py"""
import pathlib, shutil
src = pathlib.Path(__file__).parent
out = src.parent / "nhiem-vu"
out.mkdir(exist_ok=True)
app = (src / "index.html").read_text(encoding="utf-8")
html = ('<!doctype html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<meta name="theme-color" content="#0C0A1C">\n'
        '<style>body{margin:0}[hidden]{display:none!important}img{max-width:100%}</style>\n'
        '<script src="config.js"></script>\n<script src="backend.js"></script>\n</head>\n<body>\n'
        + app + '\n</body>\n</html>\n')
(out / "index.html").write_text(html, encoding="utf-8")
shutil.copy(src / "backend.js", out / "backend.js")
if not (out / "config.js").exists():
    shutil.copy(src / "config.js", out / "config.js")
print("Đã tạo", out / "index.html")
