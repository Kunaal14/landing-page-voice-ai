import React, { useState } from 'react';

/**
 * Diagnostic Test Component for Slider Issue
 * Use this to isolate whether the problem is CSS, React, or parent containers
 */
export function SliderDiagnostic() {
  const [value, setValue] = useState(50);

  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '500px', 
      margin: '0 auto',
      background: '#050505',
      color: '#ffffff',
      minHeight: '100vh'
    }}>
      <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>🔍 Slider Diagnostic Tests</h2>
      
      {/* Test 1: Bare Input (No CSS) */}
      <div style={{ marginBottom: '40px', padding: '20px', background: '#0a0a0a', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Test 1: Bare Input (No CSS)</h3>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <p style={{ marginTop: '10px', color: '#888' }}>Value: {value}</p>
        <p style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
          ✅ Can you drag this? If YES, CSS is the problem. If NO, it's something else.
        </p>
      </div>

      <hr style={{ margin: '40px 0', borderColor: '#333' }} />

      {/* Test 2: Input with Minimal Custom CSS */}
      <div style={{ marginBottom: '40px', padding: '20px', background: '#0a0a0a', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Test 2: Input with Minimal Custom CSS</h3>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          style={{
            width: '100%',
            cursor: 'grab',
            height: '24px',
          }}
        />
        <p style={{ marginTop: '10px', color: '#888' }}>Value: {value}</p>
        <p style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
          ✅ Can you drag this? If YES, complex CSS is the problem. If NO, it's the basic styling.
        </p>
      </div>

      <hr style={{ margin: '40px 0', borderColor: '#333' }} />

      {/* Test 3: Input with -webkit-appearance: none */}
      <div style={{ marginBottom: '40px', padding: '20px', background: '#0a0a0a', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Test 3: Input with appearance: none</h3>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          style={{
            width: '100%',
            cursor: 'grab',
            height: '24px',
            WebkitAppearance: 'none',
            appearance: 'none',
          }}
        />
        <p style={{ marginTop: '10px', color: '#888' }}>Value: {value}</p>
        <p style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
          ✅ Can you drag this? If NO, appearance: none is breaking drag.
        </p>
      </div>

      <hr style={{ margin: '40px 0', borderColor: '#333' }} />

      {/* Test 4: Input with Custom Thumb (Minimal) */}
      <div style={{ marginBottom: '40px', padding: '20px', background: '#0a0a0a', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Test 4: Input with Custom Thumb CSS</h3>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="diagnostic-slider"
          style={{ width: '100%' }}
        />
        <p style={{ marginTop: '10px', color: '#888' }}>Value: {value}</p>
        <p style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
          ✅ Can you drag this? Tests if custom thumb styling breaks drag.
        </p>
      </div>

      <hr style={{ margin: '40px 0', borderColor: '#333' }} />

      {/* Test 5: Input Inside overflow-hidden Container */}
      <div style={{ 
        marginBottom: '40px', 
        padding: '20px', 
        background: '#0a0a0a', 
        borderRadius: '8px',
        overflow: 'hidden' // This might be the problem!
      }}>
        <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Test 5: Input Inside overflow: hidden Container</h3>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <p style={{ marginTop: '10px', color: '#888' }}>Value: {value}</p>
        <p style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
          ✅ Can you drag this? If NO, overflow: hidden is blocking drag.
        </p>
      </div>

      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        background: '#1a1a1a', 
        borderRadius: '8px',
        fontSize: '14px',
        lineHeight: '1.6'
      }}>
        <h3 style={{ marginBottom: '15px' }}>📋 Test Results Checklist</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '10px' }}>☐ Test 1 (Bare): Draggable? YES / NO</li>
          <li style={{ marginBottom: '10px' }}>☐ Test 2 (Minimal CSS): Draggable? YES / NO</li>
          <li style={{ marginBottom: '10px' }}>☐ Test 3 (appearance: none): Draggable? YES / NO</li>
          <li style={{ marginBottom: '10px' }}>☐ Test 4 (Custom Thumb): Draggable? YES / NO</li>
          <li style={{ marginBottom: '10px' }}>☐ Test 5 (overflow: hidden): Draggable? YES / NO</li>
        </ul>
      </div>
    </div>
  );
}

