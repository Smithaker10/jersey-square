import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { catalogRouter } from './routes/catalog.js';
import { inquiriesRouter } from './routes/inquiries.js';
import { productsRouter } from './routes/products.js';
import { settingsRouter } from './routes/settings.js';
import { adminRouter } from './routes/admin.js';
import { cartRouter } from './routes/cart.js';
import { wishlistRouter } from './routes/wishlist.js';
import { ordersRouter } from './routes/orders.js';
import { couponsRouter } from './routes/coupons.js';

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
  }),
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'jerseysquare-api' });
});

app.use('/api/catalog', catalogRouter);
app.use('/api/products', productsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/coupons', couponsRouter);

app.listen(port, () => {
  console.log(`JerseySquare API listening on http://localhost:${port}`);
});
