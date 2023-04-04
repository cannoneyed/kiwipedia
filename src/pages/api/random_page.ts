import clientPromise from '@/lib/mongodb';

export default async function handler(req: any, res: any) {
  const client = await clientPromise;
  const db = client.db('kiwipedia');

  const pages = await db
    .collection('wikis')
    .aggregate([{ $sample: { size: 20 } }])
    .project({ title: 1, pageId: 1, _id: 0 })
    .toArray();

  const pageId = pages[0].pageId;
  res.redirect(307, `/wiki/${pageId}`);
}
