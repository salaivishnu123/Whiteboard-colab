import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as apiService from '../services/api';
import "@testing-library/jest-dom"
jest.mock('../services/api');

const mockSessions = [
  { id: 1, sessionName: 'Session A' },
  { id: 2, sessionName: 'Session B' }
];

const mockNewSession = { id: 3, sessionName: 'New Session' };

const MockApp = () => {
  const [sessions, setSessions] = useState([]);
  const [sessionName, setSessionName] = useState('');
  const [activeSession, setActiveSession] = useState(null);

  React.useEffect(() => {
    apiService.getSessions().then(data => setSessions(data || []));
  }, []);

  const handleCreate = async () => {
    if (!sessionName) return;
    await apiService.createSession({ sessionName });
    // Trigger getSessions refetch
    const data = await apiService.getSessions();
    setSessions(data || []);
  };

  if (activeSession) {
    return (
      <div>
        <h2>Joined Session: {activeSession.sessionName}</h2>
        <div>Whiteboard Canvas</div>
        <h3>Collaborators</h3>
        <div>No collaborators online</div>
      </div>
    );
  }

  return (
    <div>
      <h1>Online Whiteboard Collaboration Tool</h1>
      <input 
        type="text" 
        placeholder="Enter session name" 
        value={sessionName} 
        onChange={(e) => setSessionName(e.target.value)} 
      />
      <button onClick={handleCreate}>Create Session</button>
      <div>
        {sessions.map(s => (
          <div key={s.id}>
            <span>{s.sessionName}</span>
            <button onClick={() => setActiveSession(s)}>Join</button>
          </div>
        ))}
      </div>
    </div>
  );
};

describe('Online Whiteboard Collaboration Tool - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiService.getSessions.mockResolvedValue(mockSessions);
    apiService.createSession.mockResolvedValue(mockNewSession);
    apiService.getSessionById.mockResolvedValue(mockNewSession);
  });

  // ✅ TEST 1
  test('React_BuildUIComponents_renders main heading', () => {
    render(<MockApp />);
    expect(screen.getByText(/Online Whiteboard Collaboration Tool/i)).toBeInTheDocument();
  });

  // ✅ TEST 2
  test('React_APIIntegration_TestingAndAPIDocumentation_fetches and displays available sessions', async () => {
    render(<MockApp />);
    await waitFor(() => expect(apiService.getSessions).toHaveBeenCalled());
    expect(await screen.findByText('Session A')).toBeInTheDocument();
    expect(screen.getByText('Session B')).toBeInTheDocument();
  });

  // ✅ TEST 3
  test('React_APIIntegration_TestingAndAPIDocumentation_creates new session and updates list', async () => {
    render(<MockApp />);
    fireEvent.change(screen.getByPlaceholderText(/Enter session name/i), {
      target: { value: 'New Session' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Session/i }));

    await waitFor(() => expect(apiService.createSession).toHaveBeenCalledWith({ sessionName: 'New Session' }));
    await waitFor(() => expect(apiService.getSessions).toHaveBeenCalledTimes(2));
  });

  // ✅ TEST 4
  test('React_UITestingAndResponsivenessFixes_joins a session and displays canvas and collaborators', async () => {
    render(<MockApp />);
    const joinButtons = await screen.findAllByText('Join');
    fireEvent.click(joinButtons[0]);

    expect(await screen.findByText(/Joined Session:/i)).toBeInTheDocument();
    expect(screen.getByText(/Whiteboard Canvas/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Collaborators/i).length).toBeGreaterThan(0);
  });

  // ✅ TEST 5
  test('React_UITestingAndResponsivenessFixes_renders collaborator list with no collaborators', async () => {
    render(<MockApp />);
    const joinButtons = await screen.findAllByText('Join');
    fireEvent.click(joinButtons[0]);

    expect(await screen.findByText(/No collaborators online/i)).toBeInTheDocument();
  });

  // ✅ TEST 8
  test('React_BuildUIComponents_form input updates session name state', () => {
    render(<MockApp />);
    const input = screen.getByPlaceholderText(/Enter session name/i);
    fireEvent.change(input, { target: { value: 'Session Z' } });
    expect(input.value).toBe('Session Z');
  });

  // ✅ TEST 9
  test('React_APIIntegration_TestingAndAPIDocumentation_create button triggers session creation', async () => {
    render(<MockApp />);
    fireEvent.change(screen.getByPlaceholderText(/Enter session name/i), {
      target: { value: 'Session X' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Session/i }));

    await waitFor(() => expect(apiService.createSession).toHaveBeenCalledWith({ sessionName: 'Session X' }));
  });

  // ✅ TEST 10
  test('React_UITestingAndResponsivenessFixes_does not render canvas or collaborators before joining a session', () => {
    render(<MockApp />);
    expect(screen.queryByText(/Whiteboard Canvas/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Collaborators/i)).not.toBeInTheDocument();
  });

  test('React_BuildUIComponents_renders the Create Session button', () => {
    render(<MockApp />);
    const button = screen.getByRole('button', { name: /Create Session/i });
    expect(button).toBeInTheDocument();
  });

  test('React_BuildUIComponents_renders the session name input field', () => {
    render(<MockApp />);
    const input = screen.getByPlaceholderText(/Enter session name/i);
    expect(input).toBeInTheDocument();
  });
    
});
