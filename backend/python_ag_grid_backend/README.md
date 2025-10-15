setup:
pip install fastapi uvicorn python_multipart

cd so that you can access main.py:
cd backend

activate venv
python -m venv venv
venv/Scripts/activate (tab)

install libraries
pip install -r requirements.txt

run the server locally:
uvicorn app:app --reload --host {local_host_addr} --port {port_number}

{local_host_addr} - by default is 127.0.0.1
{port_number} - we are using port 5000

python -m uvicorn app:app --reload --host 127.0.0.1 --port 5000
Remember to install necessary packages: pip install {package_name}