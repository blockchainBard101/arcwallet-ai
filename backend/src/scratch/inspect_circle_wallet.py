import urllib.request
import json

api_key = "TEST_API_KEY:63203027b2653fe755c7e5c0a97fa637:c8be7d2edb3003bf60663f163f1ef13a"
wallet_id = "2510ae21-549a-5b42-a10e-2fd4cf45394d"

url = f"https://api.circle.com/v1/w3s/transactions?walletIds={wallet_id}&pageSize=20"
req = urllib.request.Request(
    url,
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
    }
)

try:
    with urllib.request.urlopen(req) as response:
        data = response.read().decode('utf-8')
        txs = json.loads(data).get("data", {}).get("transactions", [])
        print(f"FOUND {len(txs)} TRANSACTIONS:")
        for tx in txs:
            print(f"- Tx ID: {tx.get('id')}")
            print(f"  Type: {tx.get('txType')}")
            print(f"  State: {tx.get('state')}")
            print(f"  Amount: {tx.get('amounts')}")
            print(f"  Created: {tx.get('createDate')}")
            print(f"  Hash: {tx.get('txHash')}")
            print()
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
