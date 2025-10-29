import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SignatureData } from '@/types/consent';

import { SignaturePad } from '../SignaturePad';

// Mock canvas context
const mockCanvasContext = {
  fillRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  clearRect: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  lineCap: 'round' as CanvasLineCap,
  lineJoin: 'round' as CanvasLineJoin,
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray([255, 255, 255, 255]) })),
  toDataURL: jest.fn(() => 'data:image/png;base64,mock-signature-data')
};

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => mockCanvasContext,
  writable: true
});

// Mock getBoundingClientRect
Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
  value: () => ({
    width: 500,
    height: 200,
    left: 0,
    top: 0
  }),
  writable: true
});

describe('SignaturePad', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders signature pad correctly', () => {
    render(<SignaturePad onSignatureChange={mockOnChange} />);

    expect(screen.getByText('Digital Signature')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /draw/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /type/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /upload/i })).toBeInTheDocument();
  });

  it('shows drawn signature tab by default', () => {
    render(<SignaturePad onSignatureChange={mockOnChange} />);

    expect(screen.getByRole('tab', { name: /draw/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Sign here with mouse or finger')).toBeInTheDocument();
  });

  it('handles tab switching correctly', async () => {
    const user = userEvent.setup();
    render(<SignaturePad onSignatureChange={mockOnChange} />);

    // Switch to type tab
    await user.click(screen.getByRole('tab', { name: /type/i }));

    expect(screen.getByDisplayValue(/type your full name/i)).toBeInTheDocument();
    expect(screen.getByText('Signature Style')).toBeInTheDocument();

    // Switch to upload tab
    await user.click(screen.getByRole('tab', { name: /upload/i }));

    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose file/i })).toBeInTheDocument();
  });

  it('handles typed signature input correctly', async () => {
    const user = userEvent.setup();
    render(<SignaturePad onSignatureChange={mockOnChange} />);

    // Switch to type tab
    await user.click(screen.getByRole('tab', { name: /type/i }));

    // Type a signature
    const input = screen.getByPlaceholderText(/type your full name/i);
    await user.type(input, 'John Doe');

    expect(input).toHaveValue('John Doe');

    // Select a font style
    const fontButton = screen.getByText('Cursive');
    await user.click(fontButton);

    // Save the signature
    const saveButton = screen.getByRole('button', { name: /save typed signature/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        type: 'typed',
        data: 'John Doe',
        timestamp: expect.any(String)
      });
    });
  });

  it('shows preview when signature is provided', () => {
    const mockSignature: SignatureData = {
      type: 'typed',
      data: 'Test Signature',
      timestamp: '2025-02-06T10:00:00Z'
    };

    render(<SignaturePad onSignatureChange={mockOnChange} value={mockSignature} />);

    expect(screen.getByText('Current Signature:')).toBeInTheDocument();
    expect(screen.getByText('Test Signature')).toBeInTheDocument();
    expect(screen.getByText(/signed: feb 6, 2025/i)).toBeInTheDocument();
  });

  it('handles signature clearing correctly', async () => {
    const user = userEvent.setup();
    const mockSignature: SignatureData = {
      type: 'typed',
      data: 'Test Signature',
      timestamp: '2025-02-06T10:00:00Z'
    };

    render(<SignaturePad onSignatureChange={mockOnChange} value={mockSignature} />);

    // Click clear button
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('handles file upload correctly', async () => {
    const user = userEvent.setup();
    render(<SignaturePad onSignatureChange={mockOnChange} />);

    // Switch to upload tab
    await user.click(screen.getByRole('tab', { name: /upload/i }));

    // Create a mock file
    const file = new File(['test'], 'signature.png', { type: 'image/png' });
    const input = screen.getByRole('button', { name: /choose file/i }).previousSibling as HTMLInputElement;

    // Upload file
    await user.upload(input, file);

    // Check that file is processed
    await waitFor(() => {
      expect(screen.getByText('signature.png')).toBeInTheDocument();
    });

    // Save the uploaded signature
    const saveButton = screen.getByRole('button', { name: /use this signature/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        type: 'uploaded',
        data: expect.stringContaining('data:image'),
        timestamp: expect.any(String)
      });
    });
  });

  it('validates file types correctly', async () => {
    const user = userEvent.setup();
    // Mock window.alert
    window.alert = jest.fn();

    render(<SignaturePad onSignatureChange={mockOnChange} />);

    // Switch to upload tab
    await user.click(screen.getByRole('tab', { name: /upload/i }));

    // Create an invalid file
    const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
    const input = screen.getByRole('button', { name: /choose file/i }).previousSibling as HTMLInputElement;

    // Try to upload invalid file
    await user.upload(input, file);

    // Check that error is shown
    expect(window.alert).toHaveBeenCalledWith('Please upload an image file (JPEG, PNG, GIF, or WebP)');
  });

  it('validates file size correctly', async () => {
    const user = userEvent.setup();
    // Mock window.alert
    window.alert = jest.fn();

    render(<SignaturePad onSignatureChange={mockOnChange} />);

    // Switch to upload tab
    await user.click(screen.getByRole('tab', { name: /upload/i }));

    // Create a large file (mock 10MB)
    const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.png', { type: 'image/png' });
    const input = screen.getByRole('button', { name: /choose file/i }).previousSibling as HTMLInputElement;

    // Try to upload large file
    Object.defineProperty(largeFile, 'size', { value: 10 * 1024 * 1024 });
    await user.upload(input, largeFile);

    // Check that error is shown
    expect(window.alert).toHaveBeenCalledWith('File size must be less than 5MB');
  });

  it('disables input when disabled prop is true', () => {
    render(<SignaturePad onSignatureChange={mockOnChange} disabled />);

    // Check that tabs are disabled
    expect(screen.getByRole('tab', { name: /draw/i })).toBeDisabled();
    expect(screen.getByRole('tab', { name: /type/i })).toBeDisabled();
    expect(screen.getByRole('tab', { name: /upload/i })).toBeDisabled();
  });

  it('handles canvas drawing simulation', async () => {
    render(<SignaturePad onSignatureChange={mockOnChange} />);

    const canvas = screen.getByRole('img'); // Canvas is rendered as an image in testing
    expect(canvas).toBeInTheDocument();

    // Simulate drawing events
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 15 });
    fireEvent.mouseUp(canvas);

    // Mock canvas drawing should have been called
    expect(mockCanvasContext.beginPath).toHaveBeenCalled();
    expect(mockCanvasContext.moveTo).toHaveBeenCalled();
    expect(mockCanvasContext.lineTo).toHaveBeenCalled();
    expect(mockCanvasContext.stroke).toHaveBeenCalled();
  });

  it('applies custom className correctly', () => {
    const customClass = 'custom-signature-class';
    render(<SignaturePad onSignatureChange={mockOnChange} className={customClass} />);

    const container = screen.getByText('Digital Signature').closest('.w-full');
    expect(container).toHaveClass(customClass);
  });

  it('shows correct signature type display', () => {
    const drawnSignature: SignatureData = {
      type: 'drawn',
      data: 'data:image/png;base64,drawn-signature',
      timestamp: '2025-02-06T10:00:00Z'
    };

    render(<SignaturePad onSignatureChange={mockOnChange} value={drawnSignature} />);

    // For drawn/uploaded signatures, should show image
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('calls onChange when signature is updated', async () => {
    const user = userEvent.setup();
    let lastSignature: SignatureData | null = null;

    const handleChange = (signature: SignatureData | null) => {
      lastSignature = signature;
    };

    render(<SignaturePad onSignatureChange={handleChange} />);

    // Switch to type tab
    await user.click(screen.getByRole('tab', { name: /type/i }));

    // Type signature
    const input = screen.getByPlaceholderText(/type your full name/i);
    await user.type(input, 'Jane Doe');

    // Save signature
    const saveButton = screen.getByRole('button', { name: /save typed signature/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(lastSignature).toEqual({
        type: 'typed',
        data: 'Jane Doe',
        timestamp: expect.any(String)
      });
    });
  });
});