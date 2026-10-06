n# Visual Habit Graph (VHG)
> **A Directed Acyclic Graph (DAG) Routine Engine & Behavioral Optimization System**  
> *Developed as an undergraduate research and software engineering showcase for MS in Computer Science admissions.*

[![DAG Invariant](https://img.shields.io/badge/Graph%20Invariant-Directed%20Acyclic%20Graph-blue.svg)](#theoretical-foundation)
[![Time Complexity](https://img.shields.io/badge/Complexity-O(|V|%20%2B%20|E|)-emerald.svg)](#algorithmic-complexity-analysis)
[![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20D3.js-purple.svg)](#system-architecture)
[![Test Suite](https://img.shields.io/badge/Unit%20Tests-100%25%20Passing-success.svg)](#testing-and-verification)

---

## 1. Executive Summary & Problem Formulation

Standard habit trackers model daily routines as flat, disconnected checklists. In reality, human habits are structurally coupled: complex cognitive tasks (e.g., *Deep Research*) depend on antecedent physical or mental states (e.g., *Sufficient Sleep*, *Morning Nutrition*).

**Visual Habit Graph** formalizes daily behavioral scheduling as a **Directed Acyclic Graph (DAG)**:
$$G = (V, E)$$
where:
* $V$ represents the set of discrete habit vertices, each weighted by an execution duration $w(v) \in \mathbb{R}^+$.
* $E \subseteq V \times V$ represents prerequisite dependency edges. A directed edge $(u, v) \in E$ enforces the invariant that milestone $u$ must be satisfied before milestone $v$ is unlocked.

---

## 2. Core Computer Science Algorithms & Mathematical Invariants

### A. Cycle Invariant Verification (3-Color Depth-First Search)
To prevent circular deadlocks (e.g., $A \to B \to C \to A$), the system executes real-time cycle detection upon any proposed edge insertion $(u, v)$:
* **Algorithm:** 3-Color DFS (`WHITE = 0`, `GRAY = 1`, `BLACK = 2`).
* **Invariant:** A graph $G$ contains a directed cycle if and only if a back-edge pointing to a vertex in the `GRAY` state (current recursion call stack) is encountered.
* **Complexity:**
  $$\text{Time: } \mathcal{O}(|V| + |E|), \quad \text{Auxiliary Space: } \mathcal{O}(|V|)$$
* **Failure Handling:** If a cycle is detected, the transaction is aborted with HTTP status `400 Bad Request`, returning the reconstructed cycle path sequence for immediate remediation.

### B. Topological Stratification (Kahn’s Algorithm)
To establish linear execution queues and assign discrete milestone strata:
* **Algorithm:** Indegree-zero queue traversal.
* Computes discrete topological levels:
  $$\text{Level}(v) = \max_{(u, v) \in E} (\text{Level}(u)) + 1$$
* **Complexity:**
  $$\text{Time: } \mathcal{O}(|V| + |E|), \quad \text{Auxiliary Space: } \mathcal{O}(|V|)$$

### C. Critical Path Method (CPM) Bottleneck Detection
Using forward-pass and backward-pass dynamic programming over the DAG:
1. **Forward Pass:** Earliest Start Time ($ES$) and Earliest Finish Time ($EF$):
   $$ES(v) = \max_{u \in \text{Pred}(v)} EF(u), \quad EF(v) = ES(v) + \text{Duration}(v)$$
2. **Backward Pass:** Latest Finish Time ($LF$) and Latest Start Time ($LS$):
   $$LF(u) = \min_{v \in \text{Succ}(u)} LS(v), \quad LS(u) = LF(u) - \text{Duration}(u)$$
3. **Slack Calculation:**
   $$\text{Slack}(v) = LF(v) - EF(v)$$
* **Critical Path:** The subgraph containing all vertices where $\text{Slack}(v) = 0$. This represents the exact bottleneck chain determining the minimum time required to achieve total routine completion.

### D. Centrality & Keystone Habit Identification
To identify which habit provides maximum leverage:
* Transitive reachability is computed via Breadth-First Search (BFS) over the adjacency list:
  $$\text{Impact}(u) = |\text{Reachable}(u)| - 1$$
* The vertex with maximum downstream reachability is designated as the **Keystone Habit**.

---

## 3. Algorithmic Complexity Matrix

| Operation | Algorithm | Time Complexity | Space Complexity | Practical Optimality |
| :--- | :--- | :--- | :--- | :--- |
| **Cycle Detection** | 3-Color DFS | $\mathcal{O}(\|V\| + \|E\|)$ | $\mathcal{O}(\|V\|)$ | Instant back-edge resolution on edge creation |
| **Topological Sort** | Kahn's Algorithm | $\mathcal{O}(\|V\| + \|E\|)$ | $\mathcal{O}(\|V\|)$ | Deterministic linear ordering & level assignment |
| **Bottleneck Discovery** | Critical Path DP | $\mathcal{O}(\|V\| + \|E\|)$ | $\mathcal{O}(\|V\|)$ | Single forward/backward pass over DAG |
| **Keystone Centrality** | Transitive Closure BFS | $\mathcal{O}(\|V\| \cdot (\|V\| + \|E\|))$ | $\mathcal{O}(\|V\|)$ | Exact downstream impact factor computation |

---

## 4. Full-Stack System Architecture (MERN)

The application is structured into a modular multi-tier architecture:

```
┌────────────────────────────────────────────────────────┐
│                   Presentation Tier                    │
│   React 18 + D3.js SVG + Tailwind CSS                  │
│   • Interactive DAG Visualization & Drag Simulation    │
│   • Critical Path (CPM) Golden Glowing Flow            │
│   • Integrated CS Algorithmic Inspector                │
└───────────────────────────▲────────────────────────────┘
                            │ REST / JSON (CORS)
┌───────────────────────────▼────────────────────────────┐
│                  Application / API Tier                │
│   Node.js / Express Engine (Port 5000)                 │
│   • Route Controllers & Input Sanitization             │
│   • UTC Timezone Normalization & Streak Idempotency    │
└───────────────────────────▲────────────────────────────┘
                            │ Service Invocation
┌───────────────────────────▼────────────────────────────┐
│                    Algorithmic Tier                    │
│   • 3-Color DFS Cycle Detector                         │
│   • Kahn's Topological Sorter                          │
│   • Critical Path Method Dynamic Programming Engine   │
└───────────────────────────▲────────────────────────────┘
                            │ Mongoose ODM / Driver
┌───────────────────────────▼────────────────────────────┐
│                   Data Persistence Tier                │
│   MongoDB / Mongoose Schemas                           │
│   • HabitGraph Document (Nodes, Edges, Versioning)     │
│   • HabitLog Collection (Historical Time-Series)       │
└────────────────────────────────────────────────────────┘
```

---

## 5. RESTful API Specification

### Graph Management
* `GET /api/graph` — Retrieves the current graph along with precomputed topological order, DAG validation status, critical path, and centrality scores.
* `POST /api/graph/node` — Appends a new habit vertex $v \in V$ with custom duration and styling.
* `DELETE /api/graph/node/:id` — Removes vertex $v$ and cascades deletion of attached incident edges.
* `POST /api/graph/edge` — Validates proposed directed edge $(u, v)$ against cycle formation. Rejects circular edges with `400 Bad Request`.
* `DELETE /api/graph/edge` — Removes dependency edge $(u, v)$.
* `POST /api/graph/complete/:id` — Idempotently toggles habit completion after verifying all prerequisite indegree predecessors are satisfied.
* `GET /api/graph/analytics` — Returns graph theoretical metrics, topological depth, and keystone habit metrics.
* `GET /api/health` — System health check and runtime algorithm capabilities.

---

## 6. Running Locally

### Prerequisites
* Node.js $\ge$ 18.0.0
* npm $\ge$ 9.0.0

### 1. Launch Algorithmic Backend Server
```bash
cd server
node server.js
```
* Backend starts at `http://localhost:5000`
* Health verification: `http://localhost:5000/api/health`

### 2. Launch Frontend Client
```bash
npm install
npm run dev
```
* Open browser at `http://localhost:5173`

### 3. Run Algorithmic Unit Test Suite
```bash
cd server
node tests/graphEngine.test.js
```

---

## 7. Graduate Admissions Highlights
* **Theoretical Rigor:** Formulates routine management as a formal graph theory optimization problem.
* **Algorithmic Correctness:** Proven cycle detection and topological resolution in linear time $\mathcal{O}(|V| + |E|)$.
* **Full-Stack Proficiency:** Complete MERN stack implementation with separation of concerns between presentation, business logic, algorithmic engines, and persistence.
