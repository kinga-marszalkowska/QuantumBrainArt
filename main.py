from fastapi import FastAPI
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
from math import pi

from starlette.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:1234",
]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # You can specify HTTP methods (e.g., ["GET", "POST"])
    allow_headers=["*"],  # You can specify allowed headers
)


@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/color")
async def color(hue, count):
    try:
        hue = int(hue)
    except ValueError:
        hue = 200
    count = int(count)
    luminances = []
    saturations = []

    simulator = AerSimulator()

    circuit = QuantumCircuit(2, 2)

    circuit.initialize('00', circuit.qubits)

    circuit.u(pi / 2, pi / 4, pi / 8, 0)
    circuit.h(0)
    circuit.h(1)

    circuit.cx(1, 0)

    circuit.measure([0, 1], [0, 1])

    compiled_circuit = transpile(circuit, simulator)

    for i in range(count):
        job = simulator.run(compiled_circuit, shots=count)
        result = job.result()
        counts = result.get_counts(compiled_circuit)

        saturation = counts["11"] - counts["10"] - int(hue/10)  # change range
        luminance = counts["00"] - counts["01"] - int(hue/10)

        saturations.append(saturation)
        luminances.append(luminance)

    return {"saturation": saturations, "luminance": luminances}
