import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { makeProjectService } from './project.service';
import { db } from 'src/shared/db';
import { makeUserService } from 'src/user/user.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { User } from 'src/user/user.model';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Effect } from 'effect';
import { UnauthorizedError } from 'src/shared/errors';

@Controller('project')
@UseGuards(AuthGuard('strong-token'))
@ApiBearerAuth('access-token')
export class ProjectController {
  userService = makeUserService({ db });
  projectService = makeProjectService({ db, userService: this.userService });

  @Post()
  create(@Body() body: CreateProjectDto, @CurrentUser() user: User) {
    return this.projectService.create({
      name: body.name,
      ownerUserId: user.id,
    });
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.projectService.findAllOwnedByUser(user.id);
  }

  @Get(':id')
  findById(@Param('id') id: number, @CurrentUser() user: User) {
    return this.projectService.findById(id).pipe(
      Effect.filterOrFail(
        (project) => project.ownerUserId === user.id,
        () => new UnauthorizedError(),
      ),
    );
  }
}
