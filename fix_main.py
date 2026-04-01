from pathlib import Path

path = Path('analytics_service/main.py')
text = path.read_text()

old = '        with open(model_path, "r") as f:\n            return json.load(f)\n\n\nclass NLQueryEngine:\n    """Natural language to SQL translation engine"""\n'
new = '        with open(model_path, "r") as f:\n            return json.load(f)\n\n\nclass NLQueryEngine:\n    """Natural language to SQL translation engine"""\n'

print('found old?', text.find(old))
print('chunk:', repr(text[text.find(old):text.find(old)+100]))
