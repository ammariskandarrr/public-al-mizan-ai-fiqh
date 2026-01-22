---
description: How to process and embed documents into Supabase
---

This workflow guides you through extracting, chunking, and embedding the PDF documents into the Supabase Vector Store.

### 1. Setup Environment

Ensure you have your `.env` file populated with the following:
```env
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Create Database Tables

Run the SQL found in `Document Processing/database_setup.sql` in your Supabase SQL Editor. This will:
- Enable `pgvector`
- Create tables for each document source
- Create HNSW indexes for fast search

### 3. Install Dependencies

In the `Document Processing` folder, install the required Python packages:
```bash
pip install -r "Document Processing/requirements.txt"
```

### 4. Run Processing Scripts

Execute the scripts one by one to process each document:

// turbo
```bash
python "Document Processing/process_vdb01.py"
```

// turbo
```bash
python "Document Processing/process_vdb02.py"
```

// turbo
```bash
python "Document Processing/process_vdb03.py"
```

// turbo
```bash
python "Document Processing/process_vdb04.py"
```

// turbo
```bash
python "Document Processing/process_vdb05.py"
```

*Note: The OCR process via n8n might take several minutes depending on the document size.*
