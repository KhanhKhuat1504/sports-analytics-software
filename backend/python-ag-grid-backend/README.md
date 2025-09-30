cd so that you can access main.py:
cd backend/python-ag-grid-backend

activate venv
python -m venv venv
venv/Scripts/activate (tab)

install libraries
pip install -r requirements.txt

run the server locally:
uvicorn main:app --reload --host {local_host_addr} --port {port_number}

python -m uvicorn main:app --reload --host 127.0.0.1 --port 5000