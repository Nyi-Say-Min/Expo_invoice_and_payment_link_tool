import { desc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { orders, type Order } from '../db/schema.js'

type NewOrder = typeof orders.$inferInsert

export class OrderRepository {
  async list(limit?: number) {
    const query = db.select().from(orders).orderBy(desc(orders.createdAt))
    return limit ? query.limit(limit) : query
  }

  async findById(id: string) {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1)
    return order ?? null
  }

  async create(input: NewOrder) {
    const [order] = await db.insert(orders).values(input).returning()
    return order
  }

  async savePaymentLink(
    id: string,
    paymentLink: { id: string; url: string },
  ) {
    const [order] = await db
      .update(orders)
      .set({
        stripePaymentLinkId: paymentLink.id,
        stripePaymentUrl: paymentLink.url,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning()
    return order
  }

  async markPaid(id: string, checkoutSessionId: string) {
    const [order] = await db
      .update(orders)
      .set({
        status: 'paid',
        stripeCheckoutSessionId: checkoutSessionId,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning()
    return order ?? null
  }
}

export const orderRepository = new OrderRepository()
export type { Order }
