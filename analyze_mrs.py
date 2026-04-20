import zstandard
import struct

data = open('P:/Projects/geodat/whitelist.mrs', 'rb').read()
dctx = zstandard.ZstdDecompressor()
decompressed = dctx.decompress(data)
print(f'Decompressed size: {len(decompressed)} bytes')
print(f'First 200 bytes (hex):')
for i in range(0, min(200, len(decompressed)), 16):
    chunk = decompressed[i:i+16]
    hex_str = ' '.join(f'{b:02X}' for b in chunk)
    ascii_str = ''.join(chr(b) if 32 <= b < 127 else '.' for b in chunk)
    print(f'{i:04X}: {hex_str:<48} {ascii_str}')

print(f'\nLast 64 bytes (hex):')
start = max(0, len(decompressed) - 64)
for i in range(start, len(decompressed), 16):
    chunk = decompressed[i:i+16]
    hex_str = ' '.join(f'{b:02X}' for b in chunk)
    ascii_str = ''.join(chr(b) if 32 <= b < 127 else '.' for b in chunk)
    print(f'{i:04X}: {hex_str:<48} {ascii_str}')

# Try to find domain strings
print('\n\nSearching for readable strings (length > 3):')
current = []
strings_found = []
for i, b in enumerate(decompressed):
    if 32 <= b < 127:
        current.append(chr(b))
    else:
        if len(current) > 3:
            strings_found.append((i - len(current), ''.join(current)))
        current = []
if len(current) > 3:
    strings_found.append((len(decompressed) - len(current), ''.join(current)))

for offset, s in strings_found[:50]:
    print(f'  {offset:04X}: {s}')
print(f'\nTotal strings found: {len(strings_found)}')
