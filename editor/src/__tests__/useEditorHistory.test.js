import { renderHook, act } from '@testing-library/react';
import { useEditorHistory } from '../hooks/useEditorHistory';

describe('useEditorHistory', () => {
  const mockSetters = {
    setNodes: jest.fn(),
    setEdges: jest.fn(),
    setSceneId: jest.fn(),
    setTitle: jest.fn(),
    setSelectedNodeId: jest.fn(),
    setSelectedEdgeId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('pushHistory and undo/redo', () => {
    const { result } = renderHook(() => useEditorHistory(mockSetters));

    act(() => {
      result.current.pushHistory([{ id: 'n1' }], [], 's1', 'Title 1');
      result.current.pushHistory([{ id: 'n1' }, { id: 'n2' }], [], 's1', 'Title 1');
    });

    // canUndo/canRedo are derived from refs at render time;
    // we test behavior instead of intermediate flags

    act(() => {
      result.current.doUndo();
    });

    expect(mockSetters.setNodes).toHaveBeenCalledWith([{ id: 'n1' }]);
    expect(mockSetters.setSelectedNodeId).toHaveBeenCalledWith(null);

    act(() => {
      result.current.doRedo();
    });

    expect(mockSetters.setNodes).toHaveBeenCalledWith([{ id: 'n1' }, { id: 'n2' }]);
  });

  test('undo at start does nothing', () => {
    const { result } = renderHook(() => useEditorHistory(mockSetters));
    act(() => {
      result.current.doUndo();
    });
    expect(mockSetters.setNodes).not.toHaveBeenCalled();
  });

  test('redo at end does nothing', () => {
    const { result } = renderHook(() => useEditorHistory(mockSetters));
    act(() => {
      result.current.pushHistory([{ id: 'n1' }], [], 's1', 'T1');
      result.current.doRedo();
    });
    // Should not throw or call setters beyond the initial push
    expect(mockSetters.setNodes).not.toHaveBeenCalled();
  });

  test('prunes history beyond MAX_HISTORY_SIZE', () => {
    const { result } = renderHook(() => useEditorHistory(mockSetters));
    act(() => {
      for (let i = 0; i < 55; i++) {
        result.current.pushHistory([{ id: `n${i}` }], [], 's', 'T');
      }
    });
    // After 50+ pushes, undo should still work for the most recent
    act(() => {
      result.current.doUndo();
    });
    expect(mockSetters.setNodes).toHaveBeenCalled();
  });
});
