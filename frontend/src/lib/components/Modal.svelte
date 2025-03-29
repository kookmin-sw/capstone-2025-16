<script>
    export let isOpen;
    export let selectedTables = new Set();
  
    const tables = [
      { id: "condition", name: "Condition" },
      { id: "drug", name: "Drug" },
      { id: "measurement", name: "Measurement" },
      { id: "observation", name: "Observation" },
      { id: "procedure_occurrence", name: "Procedure Occurrence" },
      { id: "specimen", name: "Specimen" },
      { id: "bio_signal", name: "Bio Signal" }
    ];
  
    function toggleTable(id) {
      if (selectedTables.has(id)) {
        selectedTables.delete(id);
      } else {
        selectedTables.add(id);
      }
      selectedTables = new Set(selectedTables); // 반응성 갱신
    }
  
    function closeModal() {
      isOpen = false;
    }
  </script>
  
  <style>
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
  
    .modal-content {
      background: white;
      padding: 20px;
      border-radius: 10px;
      width: 300px;
      text-align: center;
    }
  
    .modal-title {
      font-size: 1.5rem;
      margin-bottom: 15px;
    }
  
    .table-list {
      text-align: left;
      margin-bottom: 15px;
    }
  
    .table-list label {
      display: flex;
      align-items: center;
      margin-bottom: 5px;
    }
  
    .close-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 5px;
      cursor: pointer;
      width: 100%;
    }
  
    .close-btn:hover {
      background: #0056b3;
    }
  </style>
  
  {#if isOpen}
    <div class="modal-overlay">
      <div class="modal-content">
        <h2 class="modal-title">Showing Tables</h2>
  
        <div class="table-list">
          {#each tables as table}
            <label>
              <input type="checkbox" value={table.id} checked={selectedTables.has(table.id)} on:change={() => toggleTable(table.id)} />
                {table.name}
            </label>
          {/each}
        </div>
  
        <button class="close-btn" on:click={closeModal}>나가기</button>
      </div>
    </div>
  {/if}
  