import { Person, Relationship } from "@/types";

interface ExportData {
  personsMap: Map<string, Person>;
  relationships: Relationship[];
  roots: Person[];
  view: 'tree' | 'mindmap';
  maxDepth?: number;
}

export const generateTreeHTML = async (data: ExportData) => {
  const { personsMap, relationships, roots, maxDepth = 999 } = data;

  // Simple HTML tree với JavaScript cho interactivity
  let html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <title>Gia Phả - Sơ Đồ Cây</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f4; }
        .person { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: white; cursor: pointer; }
        .person:hover { background: #f9fafb; }
        .person-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .person-info { flex: 1; }
        .generation { background: #f0f0f0; padding: 5px 10px; border-radius: 4px; font-weight: bold; display: inline-block; margin-bottom: 5px; }
        .spouses { color: #555; font-size: 0.9em; margin-top: 5px; padding-top: 5px; border-top: 1px dashed #eee; }
        .children { margin-left: 40px; border-left: 2px solid #ccc; padding-left: 20px; }
        .children.collapsed { display: none; }
        .toggle { float: right; font-size: 18px; color: #666; }
        .female { background: #fef3f2; border-color: #fca5a5; }
        .male { background: #f0f9ff; border-color: #93c5fd; }
        .controls { text-align: center; margin: 20px 0; }
        .btn { padding: 10px 20px; margin: 0 10px; border: none; border-radius: 5px; cursor: pointer; background: #3b82f6; color: white; }
        .btn:hover { background: #2563eb; }
        .btn.secondary { background: #6b7280; }
        .btn.secondary:hover { background: #4b5563; }
        @media print { .controls { display: none; } .children.collapsed { display: block !important; } }
    </style>
</head>
<body>
    <h1>Gia Phả - Sơ Đồ Cây</h1>
    <div class="controls">
        <button class="btn" onclick="expandAll()">Mở tất cả</button>
        <button class="btn secondary" onclick="collapseAll()">Đóng tất cả</button>
        <button class="btn" onclick="window.print()">In ấn</button>
    </div>
    <div id="tree-container">
`;

  // Simple tree building function với toggle
  const buildTree = (person: Person, level: number = 0): string => {
    const children = level < maxDepth - 1
      ? relationships
          .filter(r => (r.type === 'biological_child' || r.type === 'adopted_child') && r.person_a === person.id)
          .map(r => personsMap.get(r.person_b))
          .filter(Boolean)
      : [];

    const spouses = relationships
      .filter(r => r.type === 'marriage' && (r.person_a === person.id || r.person_b === person.id))
      .map(r => {
        const spouseId = r.person_a === person.id ? r.person_b : r.person_a;
        return personsMap.get(spouseId);
      })
      .filter(Boolean) as Person[];

    const spouseHtml = spouses.length > 0 
      ? `<div class="spouses">Vợ/Chồng: ${spouses.map(s => `<strong>${s.full_name}</strong>`).join(', ')}</div>`
      : '';

    const generationText = person.generation ? `Đời thứ ${person.generation}` : 'N/A';

    let personHtml = `
    <div class="person ${person.gender}" onclick="toggleChildren(this)">
        <span class="toggle">${children.length > 0 ? '▼' : ''}</span>
        <div class="person-info">
            <div class="generation">${generationText}</div>
            <h3>${person.full_name}</h3>
            <p>Sinh năm: ${person.birth_year || "N/A"}</p>
            <p>Giới tính: ${person.gender === "female" ? "Nữ" : "Nam"}</p>
            ${person.other_names ? `<p>Tên khác: ${person.other_names}</p>` : ""}
            ${spouseHtml}
        </div>
    </div>
`;

    if (children.length > 0) {
      personHtml += `<div class="children">`;
      children.forEach(child => {
        if (child) {
          personHtml += buildTree(child, level + 1);
        }
      });
      personHtml += `</div>`;
    }

    return personHtml;
  };

  // Build tree for each root
  roots.forEach(root => {
    html += buildTree(root);
  });

  html += `
    </div>
    <script>
        function toggleChildren(element) {
            const children = element.nextElementSibling;
            const toggle = element.querySelector('.toggle');
            
            if (children && children.classList.contains('children')) {
                if (children.classList.contains('collapsed')) {
                    children.classList.remove('collapsed');
                    toggle.textContent = '▼';
                } else {
                    children.classList.add('collapsed');
                    toggle.textContent = '▶';
                }
            }
        }
        
        function expandAll() {
            document.querySelectorAll('.children.collapsed').forEach(child => {
                child.classList.remove('collapsed');
                const parent = child.previousElementSibling;
                const toggle = parent.querySelector('.toggle');
                if (toggle) toggle.textContent = '▼';
            });
        }
        
        function collapseAll() {
            document.querySelectorAll('.children').forEach(child => {
                child.classList.add('collapsed');
                const parent = child.previousElementSibling;
                const toggle = parent.querySelector('.toggle');
                if (toggle) toggle.textContent = '▶';
            });
        }
        
        // Auto-expand all pre-filtered nodes
        document.addEventListener('DOMContentLoaded', function() {
            expandAll();
        });
    </script>
</body>
</html>`;

  return html;
};

export const generateMindmapHTML = async (data: ExportData) => {
  const { personsMap, relationships, roots, maxDepth = 999 } = data;

  // Simple HTML mindmap với JavaScript cho interactivity
  let html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <title>Gia Phả - Sơ Đồ Tư Duy</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f4; }
        .person { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: white; cursor: pointer; }
        .person:hover { background: #f9fafb; }
        .person-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .person-info { flex: 1; }
        .generation { background: #f0f0f0; padding: 5px 10px; border-radius: 4px; font-weight: bold; display: inline-block; margin-bottom: 5px; }
        .spouses { color: #555; font-size: 0.9em; margin-top: 5px; padding-top: 5px; border-top: 1px dashed #eee; }
        .children { margin-left: 40px; border-left: 2px solid #ccc; padding-left: 20px; }
        .children.collapsed { display: none; }
        .toggle { float: right; font-size: 18px; color: #666; }
        .female { background: #fef3f2; border-color: #fca5a5; }
        .male { background: #f0f9ff; border-color: #93c5fd; }
        .controls { text-align: center; margin: 20px 0; }
        .btn { padding: 10px 20px; margin: 0 10px; border: none; border-radius: 5px; cursor: pointer; background: #3b82f6; color: white; }
        .btn:hover { background: #2563eb; }
        .btn.secondary { background: #6b7280; }
        .btn.secondary:hover { background: #4b5563; }
        @media print { .controls { display: none; } .children.collapsed { display: block !important; } }
    </style>
</head>
<body>
    <h1>Gia Phả - Sơ Đồ Tư Duy</h1>
    <div class="controls">
        <button class="btn" onclick="expandAll()">Mở tất cả</button>
        <button class="btn secondary" onclick="collapseAll()">Đóng tất cả</button>
        <button class="btn" onclick="window.print()">In ấn</button>
    </div>
    <div id="mindmap-container">
`;

  // Simple mindmap building function với toggle
  const buildMindmap = (person: Person, level: number = 0): string => {
    const children = level < maxDepth - 1
      ? relationships
          .filter(r => (r.type === 'biological_child' || r.type === 'adopted_child') && r.person_a === person.id)
          .map(r => personsMap.get(r.person_b))
          .filter(Boolean)
      : [];

    const spouses = relationships
      .filter(r => r.type === 'marriage' && (r.person_a === person.id || r.person_b === person.id))
      .map(r => {
        const spouseId = r.person_a === person.id ? r.person_b : r.person_a;
        return personsMap.get(spouseId);
      })
      .filter(Boolean) as Person[];

    const spouseHtml = spouses.length > 0 
      ? `<div class="spouses">Vợ/Chồng: ${spouses.map(s => `<strong>${s.full_name}</strong>`).join(', ')}</div>`
      : '';

    const generationText = person.generation ? `Đời thứ ${person.generation}` : 'N/A';

    let personHtml = `
    <div class="person ${person.gender}" onclick="toggleChildren(this)">
        <span class="toggle">${children.length > 0 ? '▼' : ''}</span>
        <div class="person-info">
            <div class="generation">${generationText}</div>
            <h3>${person.full_name}</h3>
            <p>Sinh năm: ${person.birth_year || "N/A"}</p>
            <p>Giới tính: ${person.gender === "female" ? "Nữ" : "Nam"}</p>
            ${person.other_names ? `<p>Tên khác: ${person.other_names}</p>` : ""}
            ${spouseHtml}
        </div>
    </div>
`;

    if (children.length > 0) {
      personHtml += `<div class="children">`;
      children.forEach(child => {
        if (child) {
          personHtml += buildMindmap(child, level + 1);
        }
      });
      personHtml += `</div>`;
    }

    return personHtml;
  };

  // Build mindmap for each root
  roots.forEach(root => {
    html += buildMindmap(root);
  });

  html += `
    </div>
    <script>
        function toggleChildren(element) {
            const children = element.nextElementSibling;
            const toggle = element.querySelector('.toggle');
            
            if (children && children.classList.contains('children')) {
                if (children.classList.contains('collapsed')) {
                    children.classList.remove('collapsed');
                    toggle.textContent = '▼';
                } else {
                    children.classList.add('collapsed');
                    toggle.textContent = '▶';
                }
            }
        }
        
        function expandAll() {
            document.querySelectorAll('.children.collapsed').forEach(child => {
                child.classList.remove('collapsed');
                const parent = child.previousElementSibling;
                const toggle = parent.querySelector('.toggle');
                if (toggle) toggle.textContent = '▼';
            });
        }
        
        function collapseAll() {
            document.querySelectorAll('.children').forEach(child => {
                child.classList.add('collapsed');
                const parent = child.previousElementSibling;
                const toggle = parent.querySelector('.toggle');
                if (toggle) toggle.textContent = '▶';
            });
        }
        
        // Auto-expand all pre-filtered nodes
        document.addEventListener('DOMContentLoaded', function() {
            expandAll();
        });
    </script>
</body>
</html>`;

  return html;
};

export const generateInteractiveHTML = async (data: ExportData) => {
  if (data.view === 'tree') {
    return await generateTreeHTML(data);
  } else if (data.view === 'mindmap') {
    return await generateMindmapHTML(data);
  }
  throw new Error('Unsupported view type');
};

export const downloadHTMLFile = (html: string, filename: string) => {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
