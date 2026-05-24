import './App.css';

import { useState, useEffect, useRef } from 'react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const App = () => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [newTodo, setNewTodo] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const addTodo = () => {
    if (newTodo.trim() === '') return;
    const newTodoItem: Todo = {
      id: Date.now().toString(),
      text: newTodo.trim(),
      completed: false,
      createdAt: new Date(),
    };
    setTodos([newTodoItem, ...todos]);
    setNewTodo('');
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const toggleComplete = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = () => {
    if (editText.trim() === '') {
      deleteTodo(editingId!);
      setEditingId(null);
      return;
    }
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === editingId ? { ...todo, text: editText.trim() } : todo
      )
    );
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.length - activeCount;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editingId) {
        saveEdit();
      } else {
        addTodo();
      }
    } else if (e.key === 'Escape' && editingId) {
      cancelEdit();
    }
  };

  return (
    <div className="App">
      <div className="todo-container">
        <div className="header">
          <h1>✨ TodoList Pro</h1>
          <p>Organize your day with elegance & power</p>
        </div>

        <div className="input-group">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs to be done?"
            aria-label="Add a new todo"
          />
          <button onClick={addTodo}>Add</button>
        </div>

        <div className="filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>

        <div className="stats">
          <strong>{todos.length}</strong> total •{' '}
          <strong>{activeCount}</strong> active •{' '}
          <strong>{completedCount}</strong> completed
        </div>

        {todos.length === 0 ? (
          <div className="empty-state">
            🌟 No tasks yet. Add your first one above!
          </div>
        ) : (
          <ul className="todo-list">
            {filteredTodos.map((todo) => (
              <li
                key={todo.id}
                className={`todo-item ${editingId === todo.id ? 'editing' : ''}`}
                onDoubleClick={() => !todo.completed && startEditing(todo)}
              >
                <input
                  type="checkbox"
                  className="todo-checkbox"
                  checked={todo.completed}
                  onChange={() => toggleComplete(todo.id)}
                />
                {editingId === todo.id ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={saveEdit}
                    className="todo-text"
                    aria-label="Edit todo text"
                  />
                ) : (
                  <span
                    className={`todo-text ${todo.completed ? 'completed' : ''}`}
                    onDoubleClick={() => !todo.completed && startEditing(todo)}
                  >
                    {todo.text}
                  </span>
                )}
                <div className="todo-actions">
                  {!todo.completed && (
                    <button
                      className="edit"
                      onClick={() => startEditing(todo)}
                      aria-label="Edit todo"
                    >
                      ✏️
                    </button>
                  )}
                  <button
                    className="delete"
                    onClick={() => deleteTodo(todo.id)}
                    aria-label="Delete todo"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default App;