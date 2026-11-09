import base64

# Read image.jpeg directly and encode
with open('image.jpeg', 'rb') as f:
    logo_b64 = base64.b64encode(f.read()).decode('utf-8')

with open('styles.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

with open('app.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

with open('template.html', 'r', encoding='utf-8') as f:
    html_template = f.read()

# 1. index.html (references styles.css, app.js, image.jpeg with base64 fallback)
html_linked = html_template.replace('__LOGO_B64__', logo_b64)
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html_linked)

# 2. tco_model_chai.html (fully inlined self-contained standalone HTML)
html_inlined = html_template.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + css_content + '\n</style>')
html_inlined = html_inlined.replace('<script src="app.js"></script>', '<script>\n' + js_content + '\n</script>')
html_inlined = html_inlined.replace('__LOGO_B64__', logo_b64)
with open('tco_model_chai.html', 'w', encoding='utf-8') as f:
    f.write(html_inlined)

print("Compiled both index.html and tco_model_chai.html successfully!")
print("index.html size:", len(html_linked), "bytes")
print("tco_model_chai.html size:", len(html_inlined), "bytes")
