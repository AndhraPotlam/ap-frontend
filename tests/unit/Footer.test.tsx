import { render, screen } from '@testing-library/react';
import Footer from '../../src/components/Footer';

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Facebook: () => <div data-testid="facebook-icon" />,
  Youtube: () => <div data-testid="youtube-icon" />,
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock UI separator
jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

describe('Footer Component', () => {
  it('renders contact details correctly', () => {
    render(<Footer />);
    
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Email: andhrapotlam+support@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('Phone: +91 123-456-7890')).toBeInTheDocument();
  });

  it('renders follow us section with social links', () => {
    render(<Footer />);
    
    expect(screen.getByText('Follow Us')).toBeInTheDocument();
    expect(screen.getByTestId('facebook-icon')).toBeInTheDocument();
    expect(screen.getByTestId('youtube-icon')).toBeInTheDocument();
  });

  it('displays the copyright notice with current year', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} Andhra Potlam. All rights reserved.`))).toBeInTheDocument();
  });
});
