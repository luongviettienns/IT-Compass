import type { HollandQuestion, SituationalQuestion } from '../types/assessment.js';

export const hollandQuestionsCatalog: HollandQuestion[] = [
  { id: 'R1', text: 'Tôi thích tự tay tháo lắp, sửa chữa các thiết bị điện tử hoặc máy tính.', group: 'R' },
  { id: 'R2', text: 'Tôi thích làm việc với phần cứng, hệ thống mạng hoặc máy móc hữu hình hơn là các khái niệm trừu tượng.', group: 'R' },
  { id: 'R3', text: 'Tôi cảm thấy hứng thú khi tự xây dựng hoặc cấu hình một môi trường máy chủ từ đầu.', group: 'R' },
  { id: 'R4', text: 'Khi gặp lỗi phần cứng hoặc hệ thống, tôi có xu hướng tự tay kiểm tra và sửa chữa trực tiếp thay vì nhờ người khác.', group: 'R' },
  { id: 'I1', text: 'Tôi luôn tò mò muốn hiểu nguyên lý hoạt động bên dưới một phần mềm hoặc ứng dụng.', group: 'I' },
  { id: 'I2', text: 'Tôi đam mê giải quyết các bài toán logic, thuật toán phức tạp và sẵn sàng thử nghiệm.', group: 'I' },
  { id: 'I3', text: 'Tôi thích thu thập dữ liệu, phân tích con số để tìm ra quy luật ẩn giấu bên trong.', group: 'I' },
  { id: 'I4', text: 'Khi đọc về một công nghệ mới, tôi muốn hiểu sâu cơ chế hoạt động hơn là chỉ biết cách dùng nó.', group: 'I' },
  { id: 'A1', text: 'Tôi rất nhạy cảm với màu sắc, bố cục và luôn chú ý đến tính thẩm mỹ khi sử dụng một ứng dụng.', group: 'A' },
  { id: 'A2', text: 'Tôi thích những công việc đòi hỏi sự sáng tạo, thiết kế mới lạ và không bị gò bó bởi các khuôn mẫu.', group: 'A' },
  { id: 'A3', text: 'Tôi thường có ý tưởng độc đáo để cải thiện giao diện hoặc trải nghiệm thị giác của người dùng.', group: 'A' },
  { id: 'A4', text: 'Tôi cảm thấy thỏa mãn khi tạo ra một sản phẩm thiết kế vừa đẹp vừa truyền đạt được thông điệp rõ ràng.', group: 'A' },
  { id: 'S1', text: 'Tôi rất thích lắng nghe, hướng dẫn và giúp người khác giải quyết các vấn đề kỹ thuật.', group: 'S' },
  { id: 'S2', text: 'Tôi làm việc hiệu quả nhất khi được cộng tác liên tục với các thành viên trong nhóm.', group: 'S' },
  { id: 'S3', text: 'Tôi có khả năng đặt mình vào vị trí người dùng để hiểu những khó khăn họ gặp phải.', group: 'S' },
  { id: 'S4', text: 'Tôi cảm thấy vui và có ý nghĩa khi giải thích một khái niệm kỹ thuật phức tạp cho người khác hiểu.', group: 'S' },
  { id: 'E1', text: 'Tôi tự tin trình bày, bảo vệ ý tưởng và thuyết phục người khác tin vào giải pháp công nghệ của mình.', group: 'E' },
  { id: 'E2', text: 'Tôi thích đóng vai trò lãnh đạo, điều phối công việc cho đội nhóm và quản lý tiến độ dự án.', group: 'E' },
  { id: 'E3', text: 'Tôi thường quan tâm đến việc một phần mềm sẽ mang lại lợi nhuận kinh doanh như thế nào.', group: 'E' },
  { id: 'E4', text: 'Tôi thích giao tiếp với khách hàng hoặc đối tác để biến nhu cầu thành yêu cầu kỹ thuật.', group: 'E' },
  { id: 'C1', text: 'Tôi là người tỉ mỉ, cẩn thận và thích làm việc theo quy trình đã được thiết lập sẵn.', group: 'C' },
  { id: 'C2', text: 'Tôi thích làm việc với cơ sở dữ liệu, bảng biểu thống kê và các công cụ quản lý chi tiết.', group: 'C' },
  { id: 'C3', text: 'Tôi cảm thấy thoải mái khi kiên nhẫn rà soát lỗi để đảm bảo phần mềm hoạt động chính xác.', group: 'C' },
  { id: 'C4', text: 'Với tôi, một hệ thống tốt là hệ thống có tài liệu đầy đủ, nhất quán và tuân thủ đúng các tiêu chuẩn.', group: 'C' },
];

export const situationalQuestionsCatalog: SituationalQuestion[] = [
  {
    id: 'Q25',
    context: 'Quy trình và sự cố',
    text: 'Hệ thống đang chạy bị sự cố bất ngờ lúc 2 giờ sáng. Việc đầu tiên bạn làm là gì?',
    options: [
      { id: 'A', text: 'Kiểm tra log hệ thống, phân tích nguyên nhân gốc rễ một cách có hệ thống.', bonus: { I: 2, C: 1 } },
      { id: 'B', text: 'Thử ngay các bước khắc phục quen thuộc để hệ thống hoạt động lại nhanh nhất.', bonus: { R: 2, E: 1 } },
      { id: 'C', text: 'Tra cứu runbook để đảm bảo làm đúng quy trình xử lý sự cố.', bonus: { C: 2, I: 1 } },
    ],
  },
  {
    id: 'Q26',
    context: 'Học tập và tiếp cận',
    text: 'Khi phải học một ngôn ngữ lập trình hoàn toàn mới, bạn thường làm gì trước tiên?',
    options: [
      { id: 'A', text: 'Đọc kỹ tài liệu chính thức, hiểu rõ cú pháp nền tảng trước khi viết code.', bonus: { I: 2, C: 1 } },
      { id: 'B', text: 'Clone một project mẫu, chạy thử và sửa từng lỗi xuất hiện để học qua thực hành.', bonus: { R: 2, I: 1 } },
    ],
  },
  {
    id: 'Q27',
    context: 'Môi trường làm việc',
    text: 'Môi trường nào khiến bạn phát huy tối đa năng lực?',
    options: [
      { id: 'A', text: 'Không gian yên tĩnh, tự làm việc độc lập, chìm sâu vào giải quyết vấn đề phức tạp.', bonus: { I: 2, C: 1 } },
      { id: 'B', text: 'Môi trường năng động, trao đổi ý tưởng liên tục, hợp tác đa phòng ban và tương tác khách hàng.', bonus: { S: 2, E: 2 } },
    ],
  },
  {
    id: 'Q28',
    context: 'Trọng tài kỹ thuật',
    text: 'Công ty muốn xây dựng tính năng “Gợi ý video”. Bạn muốn nhận phần việc nào nhất?',
    options: [
      { id: 'A', text: 'Viết các thuật toán và hệ thống máy chủ để đảm bảo video tải mượt mà cho hàng triệu người cùng lúc.', bonus: { I: 3, C: 1 }, specialAction: 'SE' },
      { id: 'B', text: 'Đào sâu vào dữ liệu lịch sử xem video để tìm ra quy luật người dùng thích xem gì tiếp theo.', bonus: { C: 3, I: 2 }, specialAction: 'Data' },
      { id: 'C', text: 'Xây dựng rào cản mã hóa để đảm bảo dữ liệu cá nhân của người dùng không bị rò rỉ ra ngoài.', bonus: { R: 3, I: 2 }, specialAction: 'Cybersecurity' },
    ],
  },
  {
    id: 'Q29',
    context: 'Trọng tài sản phẩm',
    text: 'Ứng dụng bán hàng bị khách hàng phàn nàn là quá khó dùng. Phản xạ của bạn là?',
    options: [
      { id: 'A', text: 'Đi gặp khách hàng để phỏng vấn xem họ vướng ở đâu, sau đó về lập kế hoạch giao việc cho team lập trình sửa lại.', bonus: { E: 3, S: 2 }, specialAction: 'QLDA' },
      { id: 'B', text: 'Thiết kế lại ngay một giao diện mới, thay đổi màu sắc và vị trí các nút bấm sao cho trực quan và thân thiện hơn.', bonus: { A: 3, S: 2 }, specialAction: 'UXUI' },
      { id: 'C', text: 'Tôi không thích giao tiếp với khách hay làm giao diện, tôi thà mở code ra tự rà soát xem luồng xử lý bị lỗi ở chỗ nào.', bonus: { I: 2, C: 1 }, specialAction: 'SE' },
    ],
  },
];
