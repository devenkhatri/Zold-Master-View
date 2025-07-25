import { Owner, Receipt } from '@/types/property';

export const mockOwners: Owner[] = [
  {
    id: '1',
    isOwner: true,
    mobile1: '9825499224',
    memberName: 'Vijaybhai Munshi',
    mobile2: '9106333410',
    cars: 'GJ 18 EC 3388',
    bikes: 'GJ 3 HU 2879',
    stickerNos: 'B-08',
    blockNumber: 'B',
    flatNumber: '404',
  },
  {
    id: '2',
    isOwner: true,
    mobile1: '9876543210',
    memberName: 'Rajesh Kumar',
    mobile2: '9123456789',
    cars: 'GJ 01 AB 1234',
    bikes: 'GJ 5 CD 5678',
    stickerNos: 'A-15',
    blockNumber: 'A',
    flatNumber: '201',
  },
  {
    id: '3',
    isOwner: false,
    mobile1: '9988776655',
    memberName: 'Priya Sharma',
    mobile2: '9234567890',
    cars: 'GJ 12 XY 9876',
    bikes: 'GJ 7 PQ 3456',
    stickerNos: 'C-22',
    blockNumber: 'C',
    flatNumber: '105',
  },
];

export const mockReceipts: Receipt[] = [
  {
    id: '1',
    receiptNo: '2022002',
    receiptDate: '2022-05-13T17:09:20.442Z',
    name: 'Vijaybhai Munshi',
    paymentAmount: 18500,
    paymentDate: '2022-05-02T00:00:00.000Z',
    remarks: 'Annual Maintenance Charges For A/C Year 2022-23',
    blockNumber: 'B',
    flatNumber: '404',
  },
  {
    id: '2',
    receiptNo: '2023002',
    receiptDate: '2023-04-29T19:29:03.722Z',
    name: 'Vijaybhai Munshi',
    paymentAmount: 22000,
    paymentDate: '2023-04-26T00:00:00.000Z',
    remarks: 'AMC for the year 2023-24',
    blockNumber: 'B',
    flatNumber: '404',
  },
  {
    id: '3',
    receiptNo: '2024002',
    receiptDate: '2024-05-07T18:14:05.847Z',
    name: 'Vijaybhai Munshi',
    paymentAmount: 24000,
    paymentDate: '2024-04-14T00:00:00.000Z',
    remarks: 'AMC for year 2024-25',
    blockNumber: 'B',
    flatNumber: '404',
  },
  {
    id: '4',
    receiptNo: '2024155',
    receiptDate: '2025-02-01T00:00:00.000Z',
    name: 'Vijaybhai Munshi',
    paymentAmount: 70,
    paymentDate: '2025-02-01T00:00:00.000Z',
    remarks: 'Received payment for 10 chairs and 2 table of society for personal use',
    blockNumber: 'B',
    flatNumber: '404',
  },
  {
    id: '5',
    receiptNo: '2025001',
    receiptDate: '2025-05-04T00:00:00.000Z',
    name: 'VIJAY H MUNSHI',
    paymentAmount: 25000,
    paymentDate: '2025-04-14T00:00:00.000Z',
    remarks: 'AMC for year 2025-26',
    blockNumber: 'B',
    flatNumber: '404',
  },
  {
    id: '6',
    receiptNo: '2024001',
    receiptDate: '2024-03-15T10:30:00.000Z',
    name: 'Rajesh Kumar',
    paymentAmount: 20000,
    paymentDate: '2024-03-10T00:00:00.000Z',
    remarks: 'Annual Maintenance Charges 2024-25',
    blockNumber: 'A',
    flatNumber: '201',
  },
];

export const blockOptions = ['A', 'B', 'C', 'D'];

export const getFlatOptions = (blockNumber: string): string[] => {
  const flatsInBlock = mockOwners
    .filter(owner => owner.blockNumber === blockNumber)
    .map(owner => owner.flatNumber);
  
  return Array.from(new Set(flatsInBlock)).sort();
};