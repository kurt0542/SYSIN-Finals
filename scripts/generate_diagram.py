import os
from PIL import Image, ImageDraw, ImageFont

def draw_diagram():
    width = 1200
    height = 800
    img = Image.new('RGB', (width, height), color='#0f172a') # dark slate background
    draw = ImageDraw.Draw(img)

    # Helper to draw rounded rectangle with text
    def draw_box(xy, fill, outline, title, subtitle="", ports=""):
        x0, y0, x1, y1 = xy
        draw.rounded_rectangle([x0, y0, x1, y1], radius=10, fill=fill, outline=outline, width=2)
        # Text
        draw.text((x0 + 15, y0 + 15), title, fill='#ffffff')
        if subtitle:
            draw.text((x0 + 15, y0 + 40), subtitle, fill='#94a3b8')
        if ports:
            draw.text((x0 + 15, y1 - 25), ports, fill='#38bdf8')

    # Title
    draw.text((40, 30), "PlaylistHub: Containerized System Architecture", fill='#f8fafc')
    draw.text((40, 55), "Network Segmentation, Persistence & CI/CD Topology", fill='#64748b')

    # Draw User Browser Box
    draw_box((50, 140, 220, 240), '#1e293b', '#3b82f6', "Client Browser", "HTTP Requests", "Port :8080")

    # Draw Reverse Proxy
    draw_box((310, 140, 520, 240), '#1e293b', '#6366f1', "proxy (Nginx 1.27)", "Single Entry Gateway", "8080:80 (Published)")

    # Arrow: Browser -> Proxy
    draw.line([(220, 190), (310, 190)], fill='#38bdf8', width=3)
    draw.polygon([(310, 190), (300, 185), (300, 195)], fill='#38bdf8')

    # Subgraph: frontend-net (Boundary)
    draw.rounded_rectangle([280, 270, 750, 750], radius=12, fill='#1e1b4b', outline='#4338ca', width=2)
    draw.text((300, 285), "frontend-net (Bridge Network)", fill='#a5b4fc')

    # Frontend Container
    draw_box((310, 330, 510, 430), '#1e293b', '#6366f1', "frontend", "Nginx Static UI", "Port :80 (Internal)")

    # Songs API
    draw_box((310, 460, 510, 560), '#1e293b', '#10b981', "songs-api", "Python 3.12 FastAPI", "Port :8000 (Internal)")

    # Playlist API
    draw_box((310, 590, 510, 690), '#1e293b', '#f59e0b', "playlist-api", "Node.js 20 Express", "Port :3000 (Internal)")

    # Arrows Proxy -> Frontend & APIs
    # To frontend
    draw.line([(415, 240), (415, 330)], fill='#a5b4fc', width=2)
    draw.polygon([(415, 330), (410, 320), (420, 320)], fill='#a5b4fc')
    # To songs-api
    draw.line([(490, 240), (540, 240), (540, 510), (510, 510)], fill='#a5b4fc', width=2)
    draw.polygon([(510, 510), (520, 505), (520, 515)], fill='#a5b4fc')
    # To playlist-api
    draw.line([(500, 240), (560, 240), (560, 640), (510, 640)], fill='#a5b4fc', width=2)
    draw.polygon([(510, 640), (520, 635), (520, 645)], fill='#a5b4fc')

    # Subgraph: backend-net (Boundary)
    draw.rounded_rectangle([600, 420, 1150, 750], radius=12, fill='#064e3b', outline='#059669', width=2)
    draw.text((620, 435), "backend-net (Isolated Private Network)", fill='#6ee7b7')

    # Database
    draw_box((800, 500, 1050, 610), '#1e293b', '#10b981', "db (PostgreSQL 16)", "Relational Store", "Port :5432 (Isolated)")

    # Volume: pg-data
    draw_box((800, 640, 1050, 720), '#0f172a', '#14b8a6', "Volume: pg-data", "Named Persistent Storage", "Survives Redeploy")

    # Database -> Volume connection
    draw.line([(925, 610), (925, 640)], fill='#14b8a6', width=3)

    # APIs -> Database connection
    draw.line([(510, 510), (800, 530)], fill='#10b981', width=3)
    draw.polygon([(800, 530), (790, 525), (790, 535)], fill='#10b981')

    draw.line([(510, 640), (750, 640), (750, 570), (800, 570)], fill='#f59e0b', width=3)
    draw.polygon([(800, 570), (790, 565), (790, 575)], fill='#f59e0b')

    # CI/CD Subgraph: Jenkins
    draw_box((800, 140, 1100, 270), '#1e293b', '#ef4444', "Jenkins LTS (CI/CD)", "Automated Pipeline", "Port :8081 / Docker Socket")
    draw.text((820, 280), "Mounts: /var/run/docker.sock\nVolume: jenkins_home", fill='#fca5a5')

    os.makedirs('docs', exist_ok=True)
    out_path = os.path.join('docs', 'architecture.png')
    img.save(out_path)
    print(f"Diagram successfully saved to {out_path}")

if __name__ == '__main__':
    draw_diagram()
