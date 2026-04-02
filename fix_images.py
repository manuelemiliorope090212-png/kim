import re

page_path = r"c:\dev\kimberly♡\kimberly-site\src\app\page.tsx"
css_path = r"c:\dev\kimberly♡\kimberly-site\src\app\globals.css"

# 1. Update page.tsx to add object-contain to floating images
with open(page_path, 'r', encoding='utf-8') as f:
    page_content = f.read()

# Replace <img class="..." ...> adding object-contain if missing
def add_object_contain(match):
    original_class = match.group(1)
    if 'object-contain' not in original_class:
        new_class = original_class + " object-contain"
        return f'className="{new_class}"'
    return match.group(0)

# Apply to all img tags with absolute, floating, bouncing, etc.
page_content = re.sub(r'className="([^"]*(bouncing-coffee|floating|absolute w-)[^"]*)"', add_object_contain, page_content)

with open(page_path, 'w', encoding='utf-8') as f:
    f.write(page_content)

# 2. Update globals.css
with open(css_path, 'r', encoding='utf-8') as f:
    css_content = f.read()

# Remove 'rotate(Xdeg)'
css_content = re.sub(r'\s*rotate\([^)]+\)', '', css_content)

# Replace 100vh with 100dvh for accurate mobile bouncing
css_content = css_content.replace('100vh', '100dvh')

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css_content)

print("Modifications complete.")
