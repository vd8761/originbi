import os
import re

def replace_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace @/components/icons/index with @/components/icons
    new_content = content.replace('@/components/icons/index', '@/components/icons')
    # Replace @/lib/services/index with @/lib/services
    new_content = new_content.replace('@/lib/services/index', '@/lib/services')
    
    if content != new_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {file_path}")

def main():
    root_dir = r'd:\xampp\htdocs\originbi\frontend'
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.next' in dirs:
            dirs.remove('.next')
        
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                replace_in_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
