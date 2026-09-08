import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import api from '../services/api';
import QuizForm from './QuizForm';

vi.mock('../services/api');

const questions = [
  { questionText: '2 + 2?', options: ['3', '4'] },
  { questionText: '3 + 3?', options: ['5', '6'] },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('QuizForm', () => {
  it('renders every question and its options', () => {
    render(<QuizForm questions={questions} submitUrl="/quizzes/x" />);

    expect(screen.getByText(/2 \+ 2\?/)).toBeInTheDocument();
    expect(screen.getByText(/3 \+ 3\?/)).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
  });

  it('shows a validation error when submitting without answering every question', async () => {
    render(<QuizForm questions={questions} submitUrl="/quizzes/x" />);

    fireEvent.click(screen.getByRole('button', { name: /submit quiz/i }));

    expect(await screen.findByText(/answer every question/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('submits the selected answers and shows a passing result', async () => {
    api.post.mockResolvedValueOnce({
      data: { passed: true, score: 100, correctCount: 2, totalQuestions: 2 },
    });
    const onPassed = vi.fn();

    render(<QuizForm questions={questions} submitUrl="/quizzes/x" onPassed={onPassed} />);

    fireEvent.click(screen.getAllByRole('radio')[1]); // "4" for question 1
    fireEvent.click(screen.getAllByRole('radio')[2]); // "5" for question 2
    fireEvent.click(screen.getByRole('button', { name: /submit quiz/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/quizzes/x', { answers: [1, 0] }));
    expect(await screen.findByText(/score: 100%/i)).toBeInTheDocument();
    expect(onPassed).toHaveBeenCalled();
  });

  it('shows a failing result without calling onPassed', async () => {
    api.post.mockResolvedValueOnce({
      data: { passed: false, score: 0, correctCount: 0, totalQuestions: 2 },
    });
    const onPassed = vi.fn();

    render(<QuizForm questions={questions} submitUrl="/quizzes/x" onPassed={onPassed} />);

    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(screen.getAllByRole('radio')[2]);
    fireEvent.click(screen.getByRole('button', { name: /submit quiz/i }));

    expect(await screen.findByText(/try again/i)).toBeInTheDocument();
    expect(onPassed).not.toHaveBeenCalled();
  });

  it('shows the server error message when submission fails', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Quiz already completed' } } });

    render(<QuizForm questions={questions} submitUrl="/quizzes/x" />);

    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(screen.getAllByRole('radio')[2]);
    fireEvent.click(screen.getByRole('button', { name: /submit quiz/i }));

    expect(await screen.findByText('Quiz already completed')).toBeInTheDocument();
  });
});
