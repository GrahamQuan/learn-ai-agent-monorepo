import { useEffect, useState } from 'react';
import './App.css';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Load todos from localStorage on mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      try {
        const parsed = JSON.parse(savedTodos);
        // Convert createdAt strings back to Date objects
        const todosWithDates = parsed.map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt),
        }));
        setTodos(todosWithDates);
      } catch (e) {
        console.error('Failed to parse todos from localStorage', e);
      }
    }
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

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
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = () => {
    if (editText.trim() === '') return;

    setTodos(todos.map((todo) => (todo.id === editingId ? { ...todo, text: editText.trim() } : todo)));

    setEditingId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const activeCount = todos.filter((todo) => !todo.completed).length;
  const completedCount = todos.length - activeCount;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editingId) {
        saveEdit();
      } else {
        addTodo();
      }
    }
  };

  return (
    <div className='app'>
      <div className='header'>
        <h1>✨ Todo List</h1>
        <p>Organize your tasks with style</p>
      </div>

      <div className='todo-container'>
        {/* Add Todo Form */}
        <div className='add-todo'>
          <input
            type='text'
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='What needs to be done?'
            className='todo-input'
          />
          <button onClick={addTodo} className='add-btn'>
            ➕ Add
          </button>
        </div>

        {/* Filter Controls */}
        <div className='filter-controls'>
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>
            All
          </button>
          <button onClick={() => setFilter('active')} className={filter === 'active' ? 'active' : ''}>
            Active
          </button>
          <button onClick={() => setFilter('completed')} className={filter === 'completed' ? 'active' : ''}>
            Completed
          </button>
        </div>

        {/* Todo List */}
        <div className='todo-list'>
          {filteredTodos.length === 0 ? (
            <div className='empty-state'>
              <p>No todos found. {filter === 'all' ? 'Add your first task!' : `Try switching to "All" filter.`}</p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className={`todo-item ${todo.completed ? 'completed' : ''} ${editingId === todo.id ? 'editing' : ''}`}
              >
                {editingId === todo.id ? (
                  <div className='edit-form'>
                    <input
                      type='text'
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className='edit-input'
                    />
                    <div className='edit-buttons'>
                      <button onClick={saveEdit} className='save-btn'>
                        ✓
                      </button>
                      <button onClick={cancelEdit} className='cancel-btn'>
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className='todo-content'>
                      <input
                        type='checkbox'
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo.id)}
                        className='todo-checkbox'
                      />
                      <span className='todo-text'>{todo.text}</span>
                      <span className='todo-date'>
                        {todo.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className='todo-actions'>
                      <button onClick={() => startEditing(todo)} className='edit-btn' aria-label='Edit todo'>
                        ✏️
                      </button>
                      <button onClick={() => deleteTodo(todo.id)} className='delete-btn' aria-label='Delete todo'>
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Stats and Clear Completed */}
        <div className='todo-stats'>
          <span className='stats-text'>
            {activeCount} {activeCount === 1 ? 'item' : 'items'} left
          </span>
          {completedCount > 0 && (
            <button onClick={() => setTodos(todos.filter((todo) => !todo.completed))} className='clear-completed'>
              Clear Completed ({completedCount})
            </button>
          )}
        </div>
      </div>

      <div className='footer'>
        <p>✨ Built with React & Vite | Todos saved to localStorage</p>
      </div>
    </div>
  );
}

export default App;
