import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findOrCreate(email: string, name: string, picture: string): Promise<User> {
    const emailLower = email.toLowerCase();
    let user = await this.findByEmail(emailLower);
    if (user) {
      user.name = name;
      user.picture = picture;
      return this.userRepository.save(user);
    }

    user = this.userRepository.create({
      email: emailLower,
      name,
      picture,
    });
    return this.userRepository.save(user);
  }
}
