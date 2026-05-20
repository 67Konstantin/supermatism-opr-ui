import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { analyzeArtwork } from './api'
import type { AnalyzeArtResponse, ArtworkResult } from './types'
import './App.css'

const MAX_UPLOAD_MB = Number(import.meta.env.VITE_MAX_UPLOAD_MB ?? 10)

const LOADING_PHASES = [
  'Считываем форму, цвет и фактуру...',
  'Ищем похожие работы в источниках...',
  'Переранжируем кандидатов по визуальному сходству...',
]

function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`
  }

  const sizeInKb = sizeInBytes / 1024
  if (sizeInKb < 1024) {
    return `${sizeInKb.toFixed(1)} KB`
  }

  return `${(sizeInKb / 1024).toFixed(2)} MB`
}

function clampSimilarity(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function similarityColor(similarity: number): string {
  const normalized = clampSimilarity(similarity)
  const hue = 6 + normalized * 1.1
  return `hsl(${hue} 78% 46%)`
}

function ResultCard({ result }: { result: ArtworkResult }) {
  return (
    <article className="result-card">
      <div className="result-image-wrap">
        <img src={result.imageUrl} alt={result.title} className="result-image" loading="lazy" />
        <span
          className="similarity-badge"
          style={{ borderColor: similarityColor(result.similarity), color: similarityColor(result.similarity) }}
        >
          {clampSimilarity(result.similarity)}%
        </span>
      </div>
      <div className="result-content">
        <h3>{result.title}</h3>
        <p className="result-artist">{result.artist}</p>
        <p>{result.description}</p>
        <a href={result.sourceUrl} target="_blank" rel="noreferrer" className="source-link">
          Открыть источник
        </a>
      </div>
    </article>
  )
}

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<AnalyzeArtResponse | null>(null)

  const applyPickedFile = useCallback((nextFile: File | null) => {
    if (!nextFile) {
      return
    }

    if (!nextFile.type.startsWith('image/')) {
      setError('Нужен файл изображения: JPEG, PNG, WEBP, HEIC или HEIF.')
      return
    }

    if (nextFile.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(`Файл слишком большой. Допустимо до ${MAX_UPLOAD_MB} MB.`)
      return
    }

    setFile(nextFile)
    setError(null)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      return
    }

    const intervalId = window.setInterval(() => {
      setLoadingPhase((prev) => (prev + 1) % LOADING_PHASES.length)
    }, 2200)

    return () => window.clearInterval(intervalId)
  }, [isLoading])

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const clipboardData = event.clipboardData
      if (!clipboardData) {
        return
      }

      const itemWithImage = Array.from(clipboardData.items).find(
        (item) => item.kind === 'file' && item.type.startsWith('image/'),
      )
      const pastedImage =
        itemWithImage?.getAsFile() ?? Array.from(clipboardData.files).find((fileEntry) => fileEntry.type.startsWith('image/'))

      if (!pastedImage) {
        return
      }

      event.preventDefault()
      const fileName = pastedImage.name?.trim() || `clipboard-image-${Date.now()}.png`
      const fileForUpload = new File([pastedImage], fileName, {
        type: pastedImage.type || 'image/png',
        lastModified: Date.now(),
      })
      applyPickedFile(fileForUpload)
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [applyPickedFile])

  const previewUrl = useMemo(() => {
    if (!file) {
      return null
    }
    return URL.createObjectURL(file)
  }, [file])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const pickedFile = event.target.files?.[0] ?? null
    applyPickedFile(pickedFile)
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setIsDragActive(true)
  }

  function handleDragLeave() {
    setIsDragActive(false)
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setIsDragActive(false)
    const droppedFile = event.dataTransfer.files?.[0] ?? null
    applyPickedFile(droppedFile)
  }

  async function handleAnalyze(event: FormEvent) {
    event.preventDefault()

    if (!file || isLoading) {
      return
    }

    setIsLoading(true)
    setLoadingPhase(0)
    setError(null)
    setResponse(null)

    try {
      const payload = await analyzeArtwork(file)
      setResponse(payload)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Не удалось выполнить анализ изображения.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  function resetAll() {
    setFile(null)
    setResponse(null)
    setError(null)
  }

  return (
    <main className="page">
      <div className="shape shape-red" aria-hidden="true" />
      <div className="shape shape-black" aria-hidden="true" />
      <div className="shape shape-yellow" aria-hidden="true" />

      <section className="hero-block">
        <p className="eyebrow">Анализ искусства с AI</p>
        <h1>Супрематизм OPR</h1>
        <p className="hero-copy">
          Загрузи произведение, получи структурный визуальный анализ и список максимально похожих работ из
          открытых источников.
        </p>
        <div className="hero-tags" aria-label="Возможности">
          <span>Стиль: супрематизм</span>
          <span>Интеграция с FastAPI</span>
          <span>Структурированный JSON</span>
        </div>
      </section>

      <section className="panel upload-panel">
        <form onSubmit={handleAnalyze} className="upload-form">
          <label
            className={`drop-zone ${isDragActive ? 'active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input type="file" accept="image/*,.heic,.heif" onChange={handleInputChange} />
            {previewUrl ? (
              <img src={previewUrl} alt="Предпросмотр загрузки" className="preview-image" />
            ) : (
              <div className="drop-zone-placeholder">
                <strong>Перетащи файл сюда</strong>
                <span>или нажми, чтобы выбрать изображение</span>
                <span>можно просто вставить скрин: Ctrl/Cmd + V</span>
              </div>
            )}
          </label>

          <div className="upload-meta">
            <div>
              <p className="label">Файл</p>
              <p className="value">{file ? file.name : 'Не выбран'}</p>
            </div>
            <div>
              <p className="label">Размер</p>
              <p className="value">{file ? formatFileSize(file.size) : '-'}</p>
            </div>
            <div>
              <p className="label">Лимит</p>
              <p className="value">{MAX_UPLOAD_MB} MB</p>
            </div>
          </div>

          <div className="upload-actions">
            <button type="submit" className="btn btn-primary" disabled={!file || isLoading}>
              {isLoading ? 'Анализируем...' : 'Запустить анализ'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={resetAll} disabled={isLoading}>
              Сбросить
            </button>
          </div>
        </form>
      </section>

      {isLoading ? (
        <section className="panel status-panel" aria-live="polite">
          <div className="pulse" aria-hidden="true" />
          <p>{LOADING_PHASES[loadingPhase]}</p>
        </section>
      ) : null}

      {error ? (
        <section className="panel error-panel" role="alert">
          <p>{error}</p>
        </section>
      ) : null}

      {response ? (
        <>
          <section className="panel analysis-panel">
            <div className="analysis-header">
              <p className="label">Предполагаемый стиль</p>
              <h2>{response.analysis.styleGuess}</h2>
              <p>{response.analysis.summary}</p>
            </div>

            <div className="analysis-grid">
              <article>
                <h3>Композиция</h3>
                <ul>
                  <li>
                    <span>Композиционная схема</span>
                    <strong>{response.analysis.composition.layout}</strong>
                  </li>
                  <li>
                    <span>Перспектива</span>
                    <strong>{response.analysis.composition.perspective}</strong>
                  </li>
                  <li>
                    <span>Симметрия</span>
                    <strong>{response.analysis.composition.symmetry}</strong>
                  </li>
                </ul>
              </article>

              <article>
                <h3>Цвет</h3>
                <div className="palette-list">
                  {response.analysis.color.palette.map((entry) => (
                    <span key={entry}>{entry}</span>
                  ))}
                </div>
                <ul>
                  <li>
                    <span>Контраст</span>
                    <strong>{response.analysis.color.contrast}</strong>
                  </li>
                  <li>
                    <span>Насыщенность</span>
                    <strong>{response.analysis.color.saturation}</strong>
                  </li>
                  <li>
                    <span>Тональные переходы</span>
                    <strong>{response.analysis.color.tonalTransitions}</strong>
                  </li>
                </ul>
              </article>

              <article>
                <h3>Фактура</h3>
                <ul>
                  <li>
                    <span>Мазок</span>
                    <strong>{response.analysis.texture.brushwork}</strong>
                  </li>
                  <li>
                    <span>Поверхность</span>
                    <strong>{response.analysis.texture.surface}</strong>
                  </li>
                  <li>
                    <span>Объём</span>
                    <strong>{response.analysis.texture.volumeModeling}</strong>
                  </li>
                </ul>
              </article>
            </div>

            <div className="markers">
              {response.analysis.stylisticMarkers.map((marker) => (
                <span key={marker}>{marker}</span>
              ))}
            </div>
          </section>

          <section className="panel results-panel">
            <div className="results-header">
              <h2>Похожие произведения</h2>
              <p>{response.results.length} найдено</p>
            </div>

            {response.results.length ? (
              <div className="results-grid">
                {response.results.map((item) => (
                  <ResultCard key={`${item.sourceUrl}-${item.title}`} result={item} />
                ))}
              </div>
            ) : (
              <p className="empty-state">Ничего не найдено. Попробуй другое изображение.</p>
            )}
          </section>
        </>
      ) : null}

      <section className="panel project-footer">
        <p className="project-note">Проект создан в учебных целях.</p>
        <p className="project-authors">
          Работу сделали: Дробязкин Константин, Туманов Артемий, Казбанов Максим, Кулекенов Дмитрий, Блинков
          Егор.
        </p>
      </section>
    </main>
  )
}

export default App
