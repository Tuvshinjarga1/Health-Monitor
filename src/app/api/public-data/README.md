# Нээлттэй API заавар

Энэхүү API нь нээлттэй ашиглах боломжтой - токен эсвэл нэвтрэлт шаардахгүй.

## Бүх ажилтнуудын мэдээлэл авах

```
GET /api/public-data
```

Параметрүүд:

- `limit` - Хэдэн ажилтныг авахаа зааж өгөх (анхны утга: 10)

Жишээ:

```
GET /api/public-data?limit=20
```

## Тодорхой ажилтны мэдээлэл авах

```
GET /api/public-data/{userId}
```

Жишээ:

```
GET /api/public-data/user123@gmail.com
```

## Фитнесс мэдээлэл авах

```
GET /api/public-data/fitness
```

Параметрүүд:

- `limit` - Хэдэн ажилтныг авахаа зааж өгөх (анхны утга: 50)

Жишээ:

```
GET /api/public-data/fitness?limit=100
```

## Алхам алхалт

Янз бүрийн хэрэгслээс эдгээр API-г дуудах боломжтой. Жишээ нь:

```javascript
// Жаваскрипт ашиглан бүх ажилтны мэдээлэл авах
fetch("/api/public-data")
  .then((response) => response.json())
  .then((data) => console.log(data));

// Тодорхой ажилтны мэдээлэл авах
fetch("/api/public-data/user123@gmail.com")
  .then((response) => response.json())
  .then((data) => console.log(data));

// Фитнесс мэдээлэл авах
fetch("/api/public-data/fitness")
  .then((response) => response.json())
  .then((data) => console.log(data));
```

## Python-д хэрэглэх жишээ

```python
import requests

# Бүх ажилтнуудын мэдээлэл авах
response = requests.get('https://yourdomain.com/api/public-data')
data = response.json()
print(data)

# Тодорхой ажилтны мэдээлэл авах
response = requests.get('https://yourdomain.com/api/public-data/user123@gmail.com')
data = response.json()
print(data)

# Фитнесс мэдээлэл авах
response = requests.get('https://yourdomain.com/api/public-data/fitness')
data = response.json()
print(data)
```
