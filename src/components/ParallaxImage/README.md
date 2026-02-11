# ParallaxImage

Переиспользуемая компонента для создания эффекта плавного движения картинки за курсором мыши с небольшим увеличением при наведении.

## Возможности

- ✅ Плавное движение картинки за курсором мыши
- ✅ Настраиваемая задержка и плавность движения
- ✅ Увеличение картинки при наведении
- ✅ Настраиваемое максимальное смещение
- ✅ Поддержка дочерних элементов (overlay)
- ✅ Полная кастомизация через пропсы

## Установка

Компонента уже находится в проекте по пути:
```
src/components/ParallaxImage/
```

## Базовое использование

```jsx
import ParallaxImage from '@/components/ParallaxImage'

function MyComponent() {
  return (
    <div style={{ width: '500px', height: '300px' }}>
      <ParallaxImage
        src="/path/to/image.jpg"
        alt="Описание изображения"
      />
    </div>
  )
}
```

## Примеры использования

### 1. Простое использование с настройками по умолчанию

```jsx
<ParallaxImage
  src="/image.jpg"
  alt="Моя картинка"
/>
```

### 2. С увеличенным смещением и масштабом

```jsx
<ParallaxImage
  src="/image.jpg"
  alt="Моя картинка"
  maxOffset={20}      // Больше смещение (по умолчанию 10)
  scale={1.05}        // Больше увеличение (по умолчанию 1.02)
/>
```

### 3. С более быстрой реакцией (меньше задержка)

```jsx
<ParallaxImage
  src="/image.jpg"
  alt="Моя картинка"
  springConfig={{
    stiffness: 300,   // Больше жесткость = быстрее реакция
    damping: 20,      // Затухание
    mass: 0.3         // Меньше масса = быстрее движение
  }}
/>
```

### 4. С более медленной реакцией (больше задержка)

```jsx
<ParallaxImage
  src="/image.jpg"
  alt="Моя картинка"
  springConfig={{
    stiffness: 100,   // Меньше жесткость = медленнее реакция
    damping: 25,      // Больше затухание = плавнее
    mass: 1           // Больше масса = медленнее движение
  }}
/>
```

### 5. С кастомными стилями

```jsx
<ParallaxImage
  src="/image.jpg"
  alt="Моя картинка"
  className="my-custom-class"
  imgClassName="my-image-class"
  style={{ borderRadius: '20px', overflow: 'hidden' }}
  imgStyle={{ objectFit: 'cover' }}
/>
```

### 6. С overlay контентом (текст, кнопки и т.д.)

```jsx
<ParallaxImage
  src="/image.jpg"
  alt="Моя картинка"
  style={{ borderRadius: '20px' }}
>
  <div style={{ 
    padding: '40px', 
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%'
  }}>
    <h2>Заголовок</h2>
    <p>Описание</p>
  </div>
</ParallaxImage>
```

### 7. С обработчиками событий

```jsx
<ParallaxImage
  src="/image.jpg"
  alt="Моя картинка"
  onMouseEnter={() => console.log('Мышь над картинкой')}
  onMouseLeave={() => console.log('Мышь ушла')}
  onMouseMove={(e) => console.log('Мышь двигается', e)}
/>
```

### 8. Использование в карточке с ссылкой

```jsx
import { Link } from 'react-router-dom'

<Link to="/some-page" style={{ display: 'block', width: '100%', height: '400px' }}>
  <ParallaxImage
    src="/image.jpg"
    alt="Картинка"
    style={{ borderRadius: '20px' }}
  >
    <div style={{ padding: '30px', color: 'white' }}>
      <h3>Заголовок карточки</h3>
      <p>Описание</p>
    </div>
  </ParallaxImage>
</Link>
```

### 9. Использование в Swiper слайдере

```jsx
import { Swiper, SwiperSlide } from 'swiper/react'
import ParallaxImage from '@/components/ParallaxImage'

<Swiper>
  <SwiperSlide>
    <ParallaxImage
      src="/slide1.jpg"
      alt="Слайд 1"
      maxOffset={15}
      scale={1.03}
    />
  </SwiperSlide>
  <SwiperSlide>
    <ParallaxImage
      src="/slide2.jpg"
      alt="Слайд 2"
      maxOffset={15}
      scale={1.03}
    />
  </SwiperSlide>
</Swiper>
```

## Параметры (Props)

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `src` | `string` | **обязательно** | URL изображения |
| `alt` | `string` | `''` | Альтернативный текст для изображения |
| `maxOffset` | `number` | `10` | Максимальное смещение картинки в пикселях |
| `scale` | `number` | `1.02` | Масштаб увеличения при наведении |
| `springConfig` | `object` | `{ stiffness: 160, damping: 18, mass: 0.5 }` | Конфигурация пружины для плавности движения |
| `className` | `string` | `''` | Дополнительные CSS классы для контейнера |
| `imgClassName` | `string` | `''` | Дополнительные CSS классы для изображения |
| `style` | `object` | `{}` | Дополнительные inline стили для контейнера |
| `imgStyle` | `object` | `{}` | Дополнительные inline стили для изображения |
| `onMouseEnter` | `function` | `undefined` | Callback при наведении мыши |
| `onMouseLeave` | `function` | `undefined` | Callback при уходе мыши |
| `onMouseMove` | `function` | `undefined` | Callback при движении мыши |
| `children` | `ReactNode` | `undefined` | Дочерние элементы, отображаемые поверх изображения |

## Примечания

- Компонента требует, чтобы родительский контейнер имел фиксированные размеры (width и height)
- Для правильной работы используйте `object-fit: cover` для изображений
- Overlay контент (children) имеет `pointer-events: none`, поэтому клики будут проходить через него к родительскому элементу
- Компонента использует `framer-motion` для анимаций

## Технические детали

Компонента использует:
- `framer-motion` для плавных анимаций
- `useMotionValue` и `useSpring` для создания эффекта задержки
- Вычисление позиции мыши относительно элемента для определения направления движения
