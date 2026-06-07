/** Curated academic summaries when AI API is unavailable */
const TOPIC_KNOWLEDGE = {
  cn: {
    title: 'Computer Networks',
    summary: `### Study Summary: Computer Networks

#### 1. Introduction
**Computer Networks** connect devices to share resources and data. Key goals: resource sharing, reliability, scalability, and communication.

#### 2. Network Models
* **OSI Model (7 layers):** Physical → Data Link → Network → Transport → Session → Presentation → Application
* **TCP/IP Model (4 layers):** Network Access → Internet → Transport → Application

#### 3. Physical & Data Link Layer
* **Transmission media:** Twisted pair, coaxial, fiber optic, wireless
* **Switching:** Circuit switching vs packet switching
* **MAC protocols:** CSMA/CD (Ethernet), CSMA/CA (Wi-Fi)
* **Error detection:** Parity, checksum, CRC

#### 4. Network Layer
* **IP addressing:** IPv4 classes, CIDR, subnetting
* **Routing algorithms:** Distance Vector (RIP), Link State (OSPF), Path Vector (BGP)
* **Devices:** Routers, gateways
* **ICMP:** Used by ping and traceroute

#### 5. Transport Layer
* **TCP:** Connection-oriented, reliable, flow & congestion control, 3-way handshake
* **UDP:** Connectionless, fast, used for streaming/DNS
* **Port numbers:** Well-known (0–1023), registered, dynamic

#### 6. Application Layer
* **HTTP/HTTPS:** Web communication
* **DNS:** Domain name → IP resolution
* **FTP, SMTP, DHCP, SNMP**

#### 7. Key Formulas & Concepts
* **Bandwidth-delay product:** $B \\times d$
* **Throughput:** Actual data transfer rate (≤ bandwidth)
* **Latency:** Propagation + transmission + queuing + processing delay

#### 8. Practice Questions
1. **Difference between TCP and UDP?** → TCP is reliable/connection-oriented; UDP is fast/unreliable.
2. **Purpose of DNS?** → Translates domain names to IP addresses.
3. **What layer does a router operate at?** → Network layer (Layer 3).

---
*Summary based on standard Computer Networks (CN) curriculum.*`,
  },
  os: {
    title: 'Operating Systems',
    summary: `### Study Summary: Operating Systems

#### 1. Processes & Threads
* **Process:** Program in execution with its own address space
* **Thread:** Lightweight execution unit within a process
* **Process states:** New → Ready → Running → Waiting → Terminated

#### 2. CPU Scheduling
* **FCFS, SJF, Round Robin, Priority, Multilevel Queue**
* **Context switching:** Save/restore process state via PCB

#### 3. Synchronization
* **Critical section problem:** Mutex, semaphores, monitors
* **Deadlock:** Mutual exclusion, hold & wait, no preemption, circular wait
* **Banker's algorithm** for deadlock avoidance

#### 4. Memory Management
* **Paging & segmentation**, virtual memory, page replacement (FIFO, LRU, Optimal)

#### 5. File Systems & I/O
* File allocation methods, disk scheduling (FCFS, SSTF, SCAN, C-SCAN)

---
*Summary based on standard Operating Systems curriculum.*`,
  },
  ds: {
    title: 'Data Structures',
    summary: `### Study Summary: Data Structures & Algorithms

#### 1. Linear Structures
* **Arrays:** $O(1)$ access, $O(n)$ insert/delete
* **Linked Lists:** Dynamic, $O(n)$ search
* **Stack (LIFO):** push, pop — used in recursion, parsing
* **Queue (FIFO):** enqueue, dequeue — used in BFS

#### 2. Trees
* **Binary Tree, BST, AVL, Red-Black Trees**
* **Traversals:** Inorder, Preorder, Postorder, Level-order
* **Heap:** Min/max heap for priority queues

#### 3. Graphs
* **BFS** (queue), **DFS** (stack/recursion)
* **Shortest path:** Dijkstra, Bellman-Ford
* **MST:** Kruskal, Prim

#### 4. Complexity
* **Big-O:** $O(1)$, $O(\\log n)$, $O(n)$, $O(n \\log n)$, $O(n^2)$

---
*Summary based on standard Data Structures curriculum.*`,
  },
  dbms: {
    title: 'Database Management Systems',
    summary: `### Study Summary: DBMS

#### 1. Relational Model
* Tables, keys (primary, foreign, candidate), normalization (1NF–BCNF)

#### 2. SQL
* **DDL:** CREATE, ALTER, DROP
* **DML:** SELECT, INSERT, UPDATE, DELETE
* **Joins:** INNER, LEFT, RIGHT, FULL

#### 3. Transactions & ACID
* **Atomicity, Consistency, Isolation, Durability**
* Concurrency control: locking, timestamps, 2PL

#### 4. Indexing & Query Optimization
* B+ trees, hash indexes, query execution plans

---
*Summary based on standard DBMS curriculum.*`,
  },
}

function getBuiltinTopicSummary(title, subject) {
  const t = (title || '').trim().toLowerCase()
  const entry = TOPIC_KNOWLEDGE[t]
  if (entry) return entry.summary

  const s = (subject || '').trim().toLowerCase()
  const subjectEntry = TOPIC_KNOWLEDGE[s.split(/\s+/)[0]]
  if (subjectEntry && t.length <= 6) return subjectEntry.summary

  return null
}

function hasBuiltinTopic(title) {
  return Boolean(TOPIC_KNOWLEDGE[(title || '').trim().toLowerCase()])
}

module.exports = { getBuiltinTopicSummary, hasBuiltinTopic, TOPIC_KNOWLEDGE }
