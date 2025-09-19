import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TagPill } from '../TagPill'

describe('TagPill', () => {
  it('should render tag text', () => {
    render(<TagPill tag="javascript" />)
    expect(screen.getByText('javascript')).toBeInTheDocument()
  })

  it('should show remove button when removable and onRemove provided', () => {
    const onRemove = vi.fn()
    render(<TagPill tag="test" onRemove={onRemove} />)

    const removeButton = screen.getByLabelText('Remove test tag')
    expect(removeButton).toBeInTheDocument()
  })

  it('should not show remove button when removable is false', () => {
    const onRemove = vi.fn()
    render(<TagPill tag="test" onRemove={onRemove} removable={false} />)

    expect(screen.queryByLabelText('Remove test tag')).not.toBeInTheDocument()
  })

  it('should call onRemove when remove button clicked', () => {
    const onRemove = vi.fn()
    render(<TagPill tag="test" onRemove={onRemove} />)

    const removeButton = screen.getByLabelText('Remove test tag')
    fireEvent.click(removeButton)

    expect(onRemove).toHaveBeenCalledWith('test')
  })

  it('should call onClick when tag clicked', () => {
    const onClick = vi.fn()
    render(<TagPill tag="test" onClick={onClick} removable={false} />)

    const tag = screen.getByText('test').parentElement
    fireEvent.click(tag!)

    expect(onClick).toHaveBeenCalledWith('test')
  })

  it('should apply custom color styles', () => {
    const { container } = render(<TagPill tag="test" color="#3B82F6" removable={false} />)

    const tag = container.querySelector('[style*="background-color"]')
    expect(tag).toHaveStyle({
      backgroundColor: '#3B82F620',
      borderColor: '#3B82F6',
      color: '#3B82F6',
    })
  })

  it('should apply size classes', () => {
    const { rerender } = render(<TagPill tag="test" size="sm" removable={false} />)
    expect(screen.getByText('test').parentElement).toHaveClass('text-xs')

    rerender(<TagPill tag="test" size="md" removable={false} />)
    expect(screen.getByText('test').parentElement).toHaveClass('text-sm')

    rerender(<TagPill tag="test" size="lg" removable={false} />)
    expect(screen.getByText('test').parentElement).toHaveClass('text-base')
  })

  it('should apply variant classes', () => {
    const { rerender } = render(<TagPill tag="test" variant="default" removable={false} />)
    expect(screen.getByText('test').parentElement).toHaveClass('bg-gray-100')

    rerender(<TagPill tag="test" variant="outline" removable={false} />)
    expect(screen.getByText('test').parentElement).toHaveClass('border')
  })

  it('should handle keyboard interaction when onClick provided', () => {
    const onClick = vi.fn()
    render(<TagPill tag="test" onClick={onClick} removable={false} />)

    const tag = screen.getByText('test').parentElement

    fireEvent.keyDown(tag!, { key: 'Enter' })
    expect(onClick).toHaveBeenCalledWith('test')

    onClick.mockClear()

    fireEvent.keyDown(tag!, { key: ' ' })
    expect(onClick).toHaveBeenCalledWith('test')
  })

  it('should stop propagation when remove button clicked', () => {
    const onRemove = vi.fn()
    const onClick = vi.fn()
    render(<TagPill tag="test" onRemove={onRemove} onClick={onClick} />)

    const removeButton = screen.getByLabelText('Remove test tag')
    fireEvent.click(removeButton)

    expect(onRemove).toHaveBeenCalledWith('test')
    expect(onClick).not.toHaveBeenCalled()
  })
})