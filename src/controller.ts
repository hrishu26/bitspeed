import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const identifyContact = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;
    const phoneStr = phoneNumber ? phoneNumber.toString() : null;

    // 1. Find all contacts matching the input email OR phone
    const directMatches = await prisma.contact.findMany({
      where: {
        OR: [
          email ? { email } : undefined,
          phoneStr ? { phoneNumber: phoneStr } : undefined,
        ].filter(Boolean) as any,
      },
    });

    // 2. Scenario: New Customer
    if (directMatches.length === 0) {
      const newPrimary = await prisma.contact.create({
        data: { email, phoneNumber: phoneStr, linkPrecedence: 'primary' },
      });
      return res.status(200).json(formatResponse(newPrimary, []));
    }

    // 3. Identify all Primary IDs involved in these matches
    const primaryIds = new Set<number>();
    directMatches.forEach((m) => {
      primaryIds.add(m.linkPrecedence === 'primary' ? m.id : m.linkedId!);
    });

    // 4. Fetch the entire cluster (all contacts sharing these primary IDs)
    let allRelated = await prisma.contact.findMany({
      where: {
        OR: [
          { id: { in: Array.from(primaryIds) } },
          { linkedId: { in: Array.from(primaryIds) } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    // 5. Determine the "True" Primary (the oldest one)
    const primaries = allRelated.filter((c) => c.linkPrecedence === 'primary');
    const mainPrimary = primaries[0];

    // 6. Handle Merging: If multiple primaries exist, downgrade the newer ones
    if (primaries.length > 1) {
      const secondaryPrimaries = primaries.slice(1);
      const idsToDowngrade = secondaryPrimaries.map((p) => p.id);

      await prisma.contact.updateMany({
        where: { OR: [{ id: { in: idsToDowngrade } }, { linkedId: { in: idsToDowngrade } }] },
        data: { linkedId: mainPrimary.id, linkPrecedence: 'secondary' },
      });

      // Refresh data after merge update
      allRelated = await prisma.contact.findMany({
        where: { OR: [{ id: mainPrimary.id }, { linkedId: mainPrimary.id }] },
        orderBy: { createdAt: 'asc' },
      });
    }

    // 7. Check if we need to create a new Secondary record
    const hasNewEmail = email && !allRelated.some((c) => c.email === email);
    const hasNewPhone = phoneStr && !allRelated.some((c) => c.phoneNumber === phoneStr);

    if (hasNewEmail || hasNewPhone) {
      const newSecondary = await prisma.contact.create({
        data: {
          email,
          phoneNumber: phoneStr,
          linkedId: mainPrimary.id,
          linkPrecedence: 'secondary',
        },
      });
      allRelated.push(newSecondary);
    }

    return res.status(200).json(formatResponse(mainPrimary, allRelated));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

function formatResponse(primary: any, cluster: any[]) {
  const allEmails = new Set<string>();
  const allPhones = new Set<string>();
  const secondaryIds: number[] = [];

  // Ensure primary info comes first
  if (primary.email) allEmails.add(primary.email);
  if (primary.phoneNumber) allPhones.add(primary.phoneNumber);

  cluster.forEach((c) => {
    if (c.email) allEmails.add(c.email);
    if (c.phoneNumber) allPhones.add(c.phoneNumber);
    if (c.id !== primary.id) secondaryIds.push(c.id);
  });

  return {
    contact: {
      primaryContatctId: primary.id,
      emails: Array.from(allEmails),
      phoneNumbers: Array.from(allPhones),
      secondaryContactIds: secondaryIds,
    },
  };
}