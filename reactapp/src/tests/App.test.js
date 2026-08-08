import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import * as apiService from '../services/api';
import "@testing-library/jest-dom"
jest.mock('../services/api');

const mockSessions = [
  { id: 1, sessionName: 'Session A' },
  { id: 2, sessionName: 'Session B' }
];

const mockNewSession = { id: 3, sessionName: 'New Session' };

describe('Online Whiteboard Collaboration Tool - Integration Tests', () => {
  beforeEach(() => {
    apiService.getSessions.mockResolvedValue(mockSessions);
    apiService.createSession.mockResolvedValue(mockNewSession);
    apiService.getSessionById.mockResolvedValue(mockNewSession);
  });

  // ✅ TEST 1
  test('React_BuildUIComponents_renders main heading', () => {
    render(<App />);
    expect(screen.getByText(/Online Whiteboard Collaboration Tool/i)).toBeInTheDocument();
  });

  // ✅ TEST 2
  test('React_APIIntegration_TestingAndAPIDocumentation_fetches and displays available sessions', async () => {
    render(<App />);
    await waitFor(() => expect(apiService.getSessions).toHaveBeenCalled());
    expect(await screen.findByText('Session A')).toBeInTheDocument();
    expect(screen.getByText('Session B')).toBeInTheDocument();
  });

  // ✅ TEST 3
  test('React_APIIntegration_TestingAndAPIDocumentation_creates new session and updates list', async () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/Enter session name/i), {
      target: { value: 'New Session' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Session/i }));

    await waitFor(() => expect(apiService.createSession).toHaveBeenCalledWith({ sessionName: 'New Session' }));
    await waitFor(() => expect(apiService.getSessions).toHaveBeenCalledTimes(2));
  });

  // ✅ TEST 4
  test('React_UITestingAndResponsivenessFixes_joins a session and displays canvas and collaborators', async () => {
    render(<App />);
    const joinButtons = await screen.findAllByText('Join');
    fireEvent.click(joinButtons[0]);

    expect(await screen.findByText(/Joined Session:/i)).toBeInTheDocument();
    expect(screen.getByText(/Whiteboard Canvas/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Collaborators/i).length).toBeGreaterThan(0);
  });

  // ✅ TEST 5
  test('React_UITestingAndResponsivenessFixes_renders collaborator list with no collaborators', async () => {
    render(<App />);
    const joinButtons = await screen.findAllByText('Join');
    fireEvent.click(joinButtons[0]);

    expect(await screen.findByText(/No collaborators online/i)).toBeInTheDocument();
  });
  // ✅ TEST 8
  test('React_BuildUIComponents_form input updates session name state', () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Enter session name/i);
    fireEvent.change(input, { target: { value: 'Session Z' } });
    expect(input.value).toBe('Session Z');
  });

  // ✅ TEST 9
  test('React_APIIntegration_TestingAndAPIDocumentation_create button triggers session creation', async () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/Enter session name/i), {
      target: { value: 'Session X' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Session/i }));

    await waitFor(() => expect(apiService.createSession).toHaveBeenCalledWith({ sessionName: 'Session X' }));
  });

  // ✅ TEST 10
  test('React_UITestingAndResponsivenessFixes_does not render canvas or collaborators before joining a session', () => {
    render(<App />);
    expect(screen.queryByText(/Whiteboard Canvas/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Collaborators/i)).not.toBeInTheDocument();
  });
  test('React_BuildUIComponents_renders the Create Session button', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /Create Session/i });
    expect(button).toBeInTheDocument();
  });
  test('React_BuildUIComponents_renders the session name input field', () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Enter session name/i);
    expect(input).toBeInTheDocument();
  });
    
});
