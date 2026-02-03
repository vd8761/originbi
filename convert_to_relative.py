import os
import re

def get_relative_prefix(file_path, root_dir):
    # Calculate how many levels deep the file is relative to root_dir
    rel_path = os.path.relpath(file_path, root_dir)
    levels = len(rel_path.split(os.sep)) - 1
    if levels == 0:
        return "./"
    return "../" * levels

def replace_aliases(match, file_path, root_dir):
    alias_path = match.group(2)
    prefix = get_relative_prefix(os.path.dirname(file_path), root_dir)
    
    # map @/abc to {prefix}abc
    # if prefix is ../../ then @/lib/services -> ../../lib/services
    # if prefix is ./ then @/lib/services -> ./lib/services
    
    new_path = alias_path
    if prefix == "./":
        # special case for same directory
        pass
    else:
        new_path = prefix + alias_path
        
    # remove double slashes if any
    new_path = new_path.replace('//', '/')
    
    return f'{match.group(1)}{new_path}{match.group(3)}'

def process_file(file_path, root_dir):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Regex to find imports with @/
    # e.g. from '@/components/...' or import('@/...')
    # (['"])@/([^'"]+)(['"])
    pattern = re.compile(r'([\'"])@/([^\'"]+)([\'"])')
    
    def replacer(match):
        alias_path = match.group(2)
        # file_path is absolute. os.path.dirname(file_path) is where the file is.
        # we need relative path from there to root_dir
        rel_to_root = os.path.relpath(root_dir, os.path.dirname(file_path))
        if rel_to_root == ".":
            new_path = "./" + alias_path
        else:
            new_path = rel_to_root + "/" + alias_path
        
        new_path = new_path.replace("\\", "/")
        # cleanup ././ if it happens
        new_path = new_path.replace("/./", "/")
        
        return f'{match.group(1)}{new_path}{match.group(3)}'

    new_content = pattern.sub(replacer, content)
    
    if content != new_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {file_path}")

def main():
    root_dir = r'd:\xampp\htdocs\originbi\frontend'
    # Specifically targeting folders that are failing or likely to fail
    target_folders = [
        os.path.join(root_dir, 'components', 'student'),
        os.path.join(root_dir, 'app', 'student'),
        os.path.join(root_dir, 'components', 'corporate'),
        os.path.join(root_dir, 'app', 'corporate'),
        os.path.join(root_dir, 'components', 'admin'),
        os.path.join(root_dir, 'app', 'admin'),
    ]
    
    for folder in target_folders:
        if not os.path.exists(folder):
            continue
        for root, dirs, files in os.walk(folder):
            for file in files:
                if file.endswith(('.tsx', '.ts')):
                    process_file(os.path.join(root, file), root_dir)

if __name__ == "__main__":
    main()
