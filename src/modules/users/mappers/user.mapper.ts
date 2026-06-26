import { User } from '../../../database/entities/user.entity';
import { UserSummaryDto } from '../dto/user-summary.dto';

export class UserMapper {
  static toSummaryDto(user: User | null): UserSummaryDto | null {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      picture: user.picture,
    };
  }
}
