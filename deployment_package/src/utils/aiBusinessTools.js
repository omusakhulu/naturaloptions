import { prisma } from '@/lib/prisma';

/**
 * AI Business Tools - Functions for Gemini to query business data
 */

export const getProjectPerformance = async (limit = 10, sortBy = 'profit') => {
  try {
    const reports = await prisma.projectCostReport.findMany({
      take: limit,
      orderBy: {
        [sortBy === 'profit' ? 'profit' : 'createdAt']: 'desc'
      }
    });

    if (reports.length === 0) {
      // If no reports, try to at least list some projects
      const projects = await prisma.project.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
      
      if (projects.length === 0) return { message: 'No projects or cost reports found in the database.' };
      
      return {
        message: 'No cost reports found, but here are the recent projects:',
        projects: projects.map(p => ({ name: p.name, status: p.status }))
      };
    }

    return reports.map(r => ({
      name: r.projectName,
      status: r.status,
      revenue: r.revenue,
      profit: r.profit,
      margin: r.profitMargin,
      estimatedCost: r.estimatedCost,
      actualCost: r.actualCost
    }));
  } catch (error) {
    console.error('AI Tool Error (getProjectPerformance):', error);
    return { error: 'Failed to fetch project performance' };
  }
};

export const getProjectDetails = async (identifier) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { id: identifier },
          { name: { contains: identifier, mode: 'insensitive' } }
        ]
      },
      include: {
        crewDetails: true,
        transport: true
      }
    });

    if (!project) return { error: 'Project not found' };

    const report = await prisma.projectCostReport.findFirst({
      where: { projectId: project.id }
    });

    return {
      ...project,
      costReport: report || 'No cost report generated yet'
    };
  } catch (error) {
    console.error('AI Tool Error (getProjectDetails):', error);
    return { error: 'Failed to fetch project details' };
  }
};

export const getOrderDetails = async (identifier) => {
  try {
    // Try POS sale first
    const posSale = await prisma.pOSSale.findFirst({
      where: {
        OR: [
          { id: identifier },
          { saleNumber: identifier }
        ]
      },
      include: {
        saleItems: {
          include: { product: true }
        },
        customer: true,
        employee: true
      }
    });

    if (posSale) return { type: 'POS_SALE', ...posSale };

    // Try WooCommerce order
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: identifier },
          { orderNumber: identifier },
          { wooId: isNaN(parseInt(identifier)) ? -1 : parseInt(identifier) }
        ]
      }
    });

    if (order) return { type: 'WOO_ORDER', ...order };

    return { error: 'Order not found' };
  } catch (error) {
    console.error('AI Tool Error (getOrderDetails):', error);
    return { error: 'Failed to fetch order details' };
  }
};

export const getSalesReport = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await prisma.pOSSale.aggregate({
      where: {
        saleDate: { gte: startDate }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    const topProducts = await prisma.pOSSaleItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        total: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });

    return {
      period: `${days} days`,
      totalRevenue: sales._sum.totalAmount,
      totalOrders: sales._count.id,
      topProducts: topProducts
    };
  } catch (error) {
    console.error('AI Tool Error (getSalesReport):', error);
    return { error: 'Failed to fetch sales report' };
  }
};

export const getInventoryHealth = async () => {
  try {
    const lowStock = await prisma.product.findMany({
      where: {
        actualStock: { lte: prisma.product.fields.lowStockAlert }
      },
      select: {
        name: true,
        actualStock: true,
        lowStockAlert: true,
        sku: true
      },
      take: 10
    });

    const totalValue = await prisma.inventoryItem.aggregate({
      _sum: {
        costPrice: true
      }
    });

    return {
      lowStockItems: lowStock,
      totalInventoryValue: totalValue._sum.costPrice
    };
  } catch (error) {
    console.error('AI Tool Error (getInventoryHealth):', error);
    return { error: 'Failed to fetch inventory health' };
  }
};

export const getExpenseSummary = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const expenses = await prisma.expense.groupBy({
      by: ['category'],
      where: {
        date: { gte: startDate }
      },
      _sum: {
        amount: true
      }
    });

    return {
      period: `${days} days`,
      categories: expenses
    };
  } catch (error) {
    console.error('AI Tool Error (getExpenseSummary):', error);
    return { error: 'Failed to fetch expense summary' };
  }
};

export const getCustomerInsights = async () => {
  try {
    const totalCustomers = await prisma.pOSCustomer.count();
    const topSpenders = await prisma.pOSCustomer.findMany({
      orderBy: { totalSpent: 'desc' },
      take: 5,
      select: {
        firstName: true,
        lastName: true,
        totalSpent: true,
        loyaltyPoints: true
      }
    });

    return {
      totalCustomers,
      topSpenders
    };
  } catch (error) {
    console.error('AI Tool Error (getCustomerInsights):', error);
    return { error: 'Failed to fetch customer insights' };
  }
};

export const getLogisticsStatus = async () => {
  try {
    const deliveryCounts = await prisma.deliveryAssignment.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const activeVehicles = await prisma.vehicle.count({
      where: { status: 'IN_USE' }
    });

    return {
      deliveries: deliveryCounts,
      activeVehicles
    };
  } catch (error) {
    console.error('AI Tool Error (getLogisticsStatus):', error);
    return { error: 'Failed to fetch logistics status' };
  }
};
