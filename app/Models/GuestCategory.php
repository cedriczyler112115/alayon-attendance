<?php

namespace App\Models;

use Database\Factories\GuestCategoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string $scope
 * @property string|null $description
 * @property int $order
 * @property bool $is_active
 * @property bool $allow_call
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'slug', 'scope', 'description', 'order', 'is_active', 'allow_call'])]
class GuestCategory extends Model
{
    /** @use HasFactory<GuestCategoryFactory> */
    use HasFactory;

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::saving(function (GuestCategory $category) {
            if (empty($category->slug) && ! empty($category->name)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'allow_call' => 'boolean',
            'order' => 'integer',
        ];
    }

    /**
     * Get the attendees belonging to this category.
     */
    public function attendees(): HasMany
    {
        return $this->hasMany(Attendee::class, 'category_id');
    }
}
